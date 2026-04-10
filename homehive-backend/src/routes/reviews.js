const router = require('express').Router();
const { authMiddleware } = require('../middleware/auth');
const { createReview, likeReview, getReviews } = require('../models/queries');

// GET /api/reviews
// Public endpoint: Read reviews from the Graph (Filtered by propertyId optimally)
router.get('/', async (req, res) => {
    try {
        const reviews = await getReviews(req.query.propertyId);
        res.json({ reviews });
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/reviews
// Protected endpoint: User writes a review for a property
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { propertyId, text, rating } = req.body;
    
    if (!propertyId || !text || !rating) {
        return res.status(400).json({ error: "Missing required Review fields" });
    }

    const review = await createReview({ 
        userId: req.user.id, 
        propertyId, 
        text, 
        rating 
    });
    
    res.status(201).json({ review });
  } catch (e) { 
      res.status(500).json({ error: e.message }); 
  }
});

// POST /api/reviews/:id/like
// Protected endpoint: User clicks a like button on someone else's review
router.post('/:id/like', authMiddleware, async (req, res) => {
  try {
    await likeReview({ userId: req.user.id, reviewId: req.params.id });
    res.json({ liked: true });
  } catch (e) { 
      res.status(500).json({ error: e.message }); 
  }
});

module.exports = router;
