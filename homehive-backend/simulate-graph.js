const { getDriver } = require('./src/config/neo4j');
require('dotenv').config();

async function runSimulation() {
    const session = getDriver().session();
    try {
        console.log("Injecting Simulated Social Web Traffic...");
        
        // Fetch a target property
        const props = await session.run('MATCH (p:Property) RETURN p.id AS id LIMIT 1');
        const propertyId = props.records[0].get('id');
        
        // Spawn Fake Users
        await session.run(`MERGE (u:User {email: 'sophia.demo@test.com'}) ON CREATE SET u.id=randomUUID(), u.name='Sophia L.', u.role='user', u.password='123'`);
        await session.run(`MERGE (u:User {email: 'marcus.demo@test.com'}) ON CREATE SET u.id=randomUUID(), u.name='Marcus R.', u.role='user', u.password='123'`);
        
        // Phase 1: Sophia books the room and writes a Review
        const rev = await session.run(`
            MATCH (u:User {email: 'sophia.demo@test.com'}), (p:Property {id: $propertyId})
            CREATE (r:Review {id: randomUUID(), text: 'This location is phenomenal. Great lighting and layout!', rating: 5, createdAt: datetime()})
            MERGE (u)-[:POSTS]->(r)
            MERGE (p)-[:HAS_REVIEW]->(r)
            RETURN r.id AS id
        `, { propertyId });
        const reviewId = rev.records[0].get('id');

        // Phase 2: Marcus sees Sophia's review online and Reacts to it!
        await session.run(`
            MATCH (u:User {email: 'marcus.demo@test.com'}), (r:Review {id: $reviewId})
            MERGE (u)-[:LIKES]->(r)
        `, { reviewId });

        console.log("Simulation Completed: [Sophia -> POSTS -> Review] + [Marcus -> LIKES -> Review]");
    } catch(e) {
        console.error("Simulation Error", e);
    } finally {
        await session.close();
        process.exit(0);
    }
}
runSimulation();
