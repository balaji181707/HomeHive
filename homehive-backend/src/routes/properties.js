const router = require('express').Router();
const { authMiddleware } = require('../middleware/auth');
const { createProperty, getProperties, getRecommendations } = require('../models/queries');

// GET /api/properties
// Public endpoint: Fetch dynamic properties (simulating frontend search & filter)
router.get('/', async (req, res) => {
  try {
    const properties = await getProperties(req.query);
    res.json({ properties });
  } catch (e) { 
      res.status(500).json({ error: e.message }); 
  }
});

// POST /api/properties
// Protected endpoint: Admins or verified landlords can create properties
router.post('/', authMiddleware, async (req, res) => {
  try {
    const property = await createProperty(req.body);
    res.status(201).json({ property });
  } catch (e) { 
      res.status(500).json({ error: e.message }); 
  }
});

// GET /api/properties/recommendations
// Protected endpoint: get recommended properties modeled from Neo4j graph relationships
router.get('/recommendations', authMiddleware, async (req, res) => {
  try {
    const recs = await getRecommendations(req.user.id);
    res.json({ recommendations: recs });
  } catch (e) { 
      res.status(500).json({ error: e.message }); 
  }
});

module.exports = router;
