const responseHandler = require('../utils/responseHandler');

const isAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return responseHandler.error(res, 'User not authenticated', 401);
    }

    if (req.user.role !== 'admin') {
      return responseHandler.error(res, 'Access denied. Admin privileges required.', 403);
    }

    next();
  } catch (error) {
    return responseHandler.error(res, 'Authorization error', 500);
  }
};

module.exports = { isAdmin };
