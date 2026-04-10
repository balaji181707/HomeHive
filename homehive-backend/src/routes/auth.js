const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { getDriver } = require('../config/neo4j');

// POST /api/auth/signup
// Register a new user in the Neo4j Graph
router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  // Hash the password securely so we don't store plain text
  const hashed = await bcrypt.hash(password, 12);
  const driver = getDriver();
  const session = driver.session();

  try {
    // 1. Check if the user already exists
    const checkResult = await session.run(
      'MATCH (existing:User {email: $email}) RETURN existing', 
      { email }
    );

    if (checkResult.records.length > 0) {
      return res.status(409).json({ error: 'Email is already registered' });
    }

    // 2. Create the user Node in the graph
    const createResult = await session.run(`
      CREATE (u:User {
        id: randomUUID(), 
        email: $email, 
        name: $name,
        password: $hashed, 
        role: 'user',
        createdAt: datetime()
      })
      RETURN u
    `, { email, name, hashed });

    const user = createResult.records[0].get('u').properties;

    // 3. Generate a JWT Token for the new user
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ 
        message: 'Signup successful', 
        token, 
        user: { id: user.id, name: user.name, email: user.email } 
    });

  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: 'Signup failed. Check server logs.' });
  } finally {
    await session.close();
  }
});

// POST /api/auth/login
// Log into the platform
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
  }

  const driver  = getDriver();
  const session = driver.session();
  
  try {
    // 1. Find the user by Email
    const result = await session.run(
      'MATCH (u:User {email: $email}) RETURN u', 
      { email }
    );
    
    if (result.records.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.records[0].get('u').properties;
    
    // 2. Compare the hashed password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 3. Generate the JWT Token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({ 
        message: 'Login successful', 
        token, 
        user: { id: user.id, name: user.name, email: user.email } 
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: 'Login failed. Check server logs.' });
  } finally {
    await session.close();
  }
});

module.exports = router;
