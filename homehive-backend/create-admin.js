const { getDriver } = require('./src/config/neo4j');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function makeAdmin() {
    const session = getDriver().session();
    try {
        const hashed = await bcrypt.hash('admin123', 12);
        await session.run(`
            MERGE (u:User {email: 'admin@test.com'})
            ON CREATE SET u.id = randomUUID(), u.name = 'Super Admin', u.password = $hashed, u.role = 'admin', u.createdAt = datetime()
            ON MATCH SET u.role = 'admin', u.password = $hashed
        `, { hashed });
        console.log("Admin account injected into Graph!");
    } catch(e) {
        console.error(e);
    } finally {
        await session.close();
        process.exit(0);
    }
}
makeAdmin();
