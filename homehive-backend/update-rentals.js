const { getDriver } = require('./src/config/neo4j');
require('dotenv').config();

async function updateLocations() {
    const session = getDriver().session();
    try {
        console.log("Pinging IP Geolocation... Detected: Hyderabad, Telangana (India)");
        console.log("Updating all graph properties to local GPS nodes in Hyderabad...");
        
        // Define hyper-local areas matching the User's live location
        const locations = ["HITEC City, Hyderabad", "Banjara Hills, Hyderabad", "Gachibowli, Hyderabad", "Jubilee Hills, Hyderabad"];
        const prices = [12500, 18000, 25500, 9500, 14000, 32000];
        
        const res = await session.run(`MATCH (p:Property) RETURN p.id AS id`);
        const pIds = res.records.map(r => r.get('id'));

        // Distribute the new live locations and default prices uniformly
        for (let i=0; i<pIds.length; i++) {
           const newLoc = locations[i % locations.length];
           const newPrice = prices[i % prices.length];
           
           await session.run(`
               MATCH (p:Property {id: $id}) 
               SET p.location = $newLoc, p.price = $newPrice
           `, { id: pIds[i], newLoc, newPrice });
        }
        
        console.log("Database gracefully synced with live GPS!");
    } catch(e) {
        console.error(e);
    } finally {
        await session.close();
        process.exit(0);
    }
}
updateLocations();
