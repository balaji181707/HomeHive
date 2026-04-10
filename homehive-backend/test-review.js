const { getDriver } = require('./src/config/neo4j');
require('dotenv').config();

async function test() {
   const session = getDriver().session();
   // Get a user
   let uRes = await session.run('MATCH (u:User) RETURN u.id LIMIT 1');
   let uid = uRes.records[0].get(0);
   // Get a prop
   let pRes = await session.run('MATCH (p:Property) RETURN p.id LIMIT 1');
   let pid = pRes.records[0].get(0);

   console.log("UserID:", uid, "PropID:", pid);

   const { createReview } = require('./src/models/queries');
   try {
       const r = await createReview({ userId: uid, propertyId: pid, text: 'Test', rating: 5 });
       console.log("Result:", r);
   } catch(e) {
       console.error("Error!!!", e);
   }
   process.exit(0);
}
test();
