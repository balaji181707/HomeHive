const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authentication token' });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    // Verify token validity using our JWT_SECRET
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach the user info to the request object so routes can read them
    req.user = decoded;
    
    // Continue down the pipeline
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token is expired or invalid' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
  next();
};

module.exports = { authMiddleware, adminMiddleware };
