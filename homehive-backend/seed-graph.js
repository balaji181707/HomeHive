const { createReview, likeReview } = require('./src/models/queries');
const { getDriver } = require('./src/config/neo4j');
require('dotenv').config();

async function seedGraph() {
    const session = getDriver().session();
    try {
        console.log("Seeding dummy users & relationships...");
        
        // 1. Create three fake Users instantly
        await session.run(`
            UNWIND ['Alice', 'Bob', 'Charlie'] AS name
            MERGE (u:User {email: toLower(name) + '@test.com'})
            ON CREATE SET u.id = randomUUID(), u.name = name, u.password = 'fake', u.role = 'user'
        `);

        // Get those Users IDs
        const usersRes = await session.run(`MATCH (u:User) RETURN u.id AS id`);
        const userIds = usersRes.records.map(r => r.get('id'));

        // Get Property IDs
        const propsRes = await session.run(`MATCH (p:Property) RETURN p.id AS id LIMIT 3`);
        const propIds = propsRes.records.map(r => r.get('id'));

        if(userIds.length > 2 && propIds.length > 1) {
            console.log("Wiring intricate relationships...");
            // User 0 posts review on Prop 0
            const rev1 = await createReview({ userId: userIds[0], propertyId: propIds[0], text: "Amazing place!", rating: 5});
            // User 1 posts review on Prop 0
            const rev2 = await createReview({ userId: userIds[1], propertyId: propIds[0], text: "A bit loud.", rating: 3});
            
            // User 2 likes rev1
            await likeReview({ userId: userIds[2], reviewId: rev1.id });
            // User 1 likes rev1 too
            await likeReview({ userId: userIds[1], reviewId: rev1.id });
            
            // Artificial Interest for recommendations
            await session.run(`
                MATCH (u:User {id: $uid}), (p:Property {id: $pid})
                MERGE (u)-[:INTERESTED_IN]->(p)
            `, {uid: userIds[0], pid: propIds[1]});
        }
        
        console.log("Relationships physically mapped into Neo4j!");
    } catch(e) {
        console.error("Seeding Error:", e);
    } finally {
        await session.close();
        process.exit(0);
    }
}

seedGraph();
