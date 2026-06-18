require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const connectMongoDB = require('./src/config/mongodb.config');

const app = express();

// Connect to MongoDB
connectMongoDB();

// Security and CORS middleware
app.use(helmet());
app.use(cors());

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./src/routes/auth.routes'));
app.use('/api/dishes', require('./src/routes/dish.routes'));
app.use('/api/packages', require('./src/routes/package.routes'));
app.use('/api/orders', require('./src/routes/order.routes'));
app.use('/api/agent', require('./src/agent/agent.routes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

module.exports = app;
