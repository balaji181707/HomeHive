const neo4j = require('neo4j-driver');

let driver;

const getDriver = () => {
  if (!driver) {
    const uri = process.env.NEO4J_URI;
    const user = process.env.NEO4J_USER;
    const password = process.env.NEO4J_PASSWORD;

    if (!uri || !user || !password) {
      console.warn("⚠️  WARNING: Missing Neo4j Database Credentials in .env file!");
    }

    // Creates a connection pool to the Neo4j database
    driver = neo4j.driver(
      uri,
      neo4j.auth.basic(user, password)
    );
  }
  return driver;
};

const closeDriver = async () => {
  if (driver) {
    await driver.close();
  }
};

module.exports = { getDriver, closeDriver };
