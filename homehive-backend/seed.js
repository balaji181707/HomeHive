const { createProperty } = require('./src/models/queries');
require('dotenv').config();

const rentalListings = [
    { name: "Downtown Residency Flat", type: "Flat", price: 15000, foodAvailable: "Yes", location: "Downtown, Bangalore" },
    { name: "Tech Park PG", type: "PG", price: 8000, foodAvailable: "Yes", location: "Tech Park, Bangalore" },
    { name: "Skyline Penthouse Suite", type: "Penthouse", price: 45000, foodAvailable: "No", location: "MG Road, Bangalore" },
    { name: "Central Market Room", type: "Room", price: 5000, foodAvailable: "No", location: "Central Market, Bangalore" },
    { name: "Silicon Valley PG", type: "PG", price: 9500, foodAvailable: "Yes", location: "Indiranagar, Bangalore" },
    { name: "Suburban Family Flat", type: "Flat", price: 12000, foodAvailable: "Yes", location: "Whitefield, Bangalore" },
    { name: "Business District Room", type: "Room", price: 6500, foodAvailable: "No", location: "Business District, Bangalore" },
    { name: "Premium Penthouse Apartment", type: "Penthouse", price: 55000, foodAvailable: "Yes", location: "Koramangala, Bangalore" }
];

async function seed() {
    console.log("Seeding properties into Graph...");
    for (const listing of rentalListings) {
        try {
            await createProperty(listing);
        } catch(e) {
            console.error("Error creating: ", e);
        }
    }
    console.log("Done Seeding! You can delete this file.");
    process.exit(0);
}

seed();
