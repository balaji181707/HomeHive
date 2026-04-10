const express  = require('express');
const cors     = require('cors');
const helmet   = require('helmet');
const morgan   = require('morgan');
require('dotenv').config();

// We will uncomment these once we create the routes in the next tasks
const authRoutes     = require('./src/routes/auth');
const propertyRoutes = require('./src/routes/properties');
const reviewRoutes   = require('./src/routes/reviews');
const adminRoutes    = require('./src/routes/admin');

const app  = express();
const PORT = process.env.PORT || 3000;

// Security and Logging Middleware
// app.use(helmet()); 
app.use(cors()); // Allow ALL Origins explicitly to bypass .env restrictions
app.use(morgan('dev'));
app.use(express.json()); // Parse JSON bodies

// Wired Routes
app.use('/api/auth',       authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/reviews',    reviewRoutes);
app.use('/api/admin',      adminRoutes);

// Health check endpoint just to verify the server is running
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'HomeHive API' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => console.log(`HomeHive API running slowly on http://localhost:${PORT}`));
