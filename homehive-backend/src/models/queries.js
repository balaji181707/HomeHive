const { getDriver } = require('../config/neo4j');

// ── Properties Queries ──────────────────────────────────────────
const createProperty = async (data) => {
  const session = getDriver().session();
  try {
    const res = await session.run(
      `CREATE (p:Property {
          id: randomUUID(), 
          name: $name, 
          type: $type,
          price: toInteger($price), 
          location: $location,
          foodAvailable: $foodAvailable,
          createdAt: datetime()
       }) RETURN p`,
      data
    );
    return res.records[0]?.get('p').properties;
  } finally { await session.close(); }
};

const getProperties = async (filters = {}) => {
  const session = getDriver().session();
  const { type, maxPrice, foodAvailable, searchInput } = filters;
  
  try {
    const res = await session.run(
      `MATCH (p:Property)
       WHERE ($type IS NULL OR p.type IN $type)
         AND ($maxPrice IS NULL OR p.price <= toInteger($maxPrice))
         AND ($foodAvailable IS NULL OR p.foodAvailable = $foodAvailable)
         AND ($searchInput IS NULL OR toLower(p.name) CONTAINS toLower($searchInput) OR toLower(p.location) CONTAINS toLower($searchInput))
       RETURN p ORDER BY p.createdAt DESC`,
      { 
          type: type ? (Array.isArray(type) ? type : [type]) : null, 
          maxPrice: maxPrice ? parseInt(maxPrice) : null, 
          foodAvailable: foodAvailable || null,
          searchInput: searchInput || null
      }
    );
    return res.records.map(r => r.get('p').properties);
  } finally { await session.close(); }
};

// ── Reviews Queries ──────────────────────────────────────────────
const createReview = async ({ userId, propertyId, text, rating }) => {
  const session = getDriver().session();
  try {
    const res = await session.run(
      `MATCH (u:User {id: $userId}), (p:Property {id: $propertyId})
       CREATE (r:Review {
           id: randomUUID(), text: $text, rating: toInteger($rating),
           createdAt: datetime()
       })
       CREATE (u)-[:POSTS]->(r)
       CREATE (p)-[:HAS_REVIEW]->(r)
       RETURN r`,
      { userId, propertyId, text, rating }
    );
    return res.records[0]?.get('r').properties;
  } finally { await session.close(); }
};

const likeReview = async ({ userId, reviewId }) => {
  const session = getDriver().session();
  try {
    await session.run(
      `MATCH (u:User {id: $userId}), (r:Review {id: $reviewId})
       MERGE (u)-[:LIKES]->(r)`,
      { userId, reviewId }
    );
    return { liked: true };
  } finally { await session.close(); }
};

const getReviews = async (propertyId = null) => {
    const session = getDriver().session();
    try {
        const res = await session.run(`
            MATCH (u:User)-[:POSTS]->(r:Review)<-[:HAS_REVIEW]-(p:Property)
            WHERE ($propertyId IS NULL OR p.id = $propertyId)
            OPTIONAL MATCH (reviewer:User)-[:LIKES]->(r)
            RETURN r.id AS id, r.text AS text, r.rating AS rating, toString(r.createdAt) AS createdAt,
                   u.name AS userName, 
                   p.name AS propertyName, 
                   p.id AS propId,
                   count(reviewer) AS likes
            ORDER BY createdAt DESC
        `, { propertyId });
        return res.records.map(rec => ({
            id: rec.get('id'),
            text: rec.get('text'),
            rating: rec.get('rating').toNumber(),
            createdAt: rec.get('createdAt'),
            userName: rec.get('userName'),
            propertyName: rec.get('propertyName'),
            propertyId: rec.get('propId'),
            likes: rec.get('likes').toNumber()
        }));
    } finally {
        await session.close();
    }
};

// ── Personal Graph Recommendations ──────────────────────────────────────
const getRecommendations = async (userId) => {
  const session = getDriver().session();
  try {
    const res = await session.run(
      `MATCH (u:User {id: $userId})-[:INTERESTED_IN]->(p:Property)
       WITH collect(p.type) AS preferredTypes
       MATCH (other:Property)
       WHERE other.type IN preferredTypes
       RETURN other ORDER BY other.price ASC LIMIT 5`,
      { userId }
    );
    return res.records.map(r => r.get('other').properties);
  } finally { await session.close(); }
};

module.exports = { createProperty, getProperties, createReview, likeReview, getReviews, getRecommendations };
