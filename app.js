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

// #region agent log
app.use((req, res, next) => { if (req.originalUrl && req.originalUrl.startsWith('/api/orders')) { try { require('fs').appendFileSync(require('path').join(__dirname, '..', '.cursor', 'debug-5d23e0.log'), JSON.stringify({sessionId:'5d23e0',hypothesisId:'A',location:'app.js:reqlogger',message:'incoming orders request',data:{method:req.method,url:req.originalUrl},timestamp:Date.now()})+'\n'); } catch(e){} } next(); });
// #endregion

// Routes
app.use('/api/auth', require('./src/routes/auth.routes'));
app.use('/api/dishes', require('./src/routes/dish.routes'));
app.use('/api/packages', require('./src/routes/package.routes'));
app.use('/api/orders', require('./src/routes/order.routes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// #region agent log
app.use((req, res, next) => { try { require('fs').appendFileSync(require('path').join(__dirname, '..', '.cursor', 'debug-5d23e0.log'), JSON.stringify({sessionId:'5d23e0',hypothesisId:'A',location:'app.js:404',message:'no route matched -> 404',data:{method:req.method,url:req.originalUrl},timestamp:Date.now()})+'\n'); } catch(e){} next(); });
// #endregion

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
