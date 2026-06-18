const jwt = require('jsonwebtoken');
const responseHandler = require('../utils/responseHandler');

const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return responseHandler.error(res, 'No token provided', 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return responseHandler.error(res, 'Invalid or expired token', 401);
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
    }
  } catch (error) {
    // Invalid token on an optional route: treat the caller as anonymous.
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return responseHandler.error(res, 'Access denied: admins only', 403);
  }
  next();
};

module.exports = { verifyToken, optionalAuth, requireAdmin };
