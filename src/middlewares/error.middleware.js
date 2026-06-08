const responseHandler = require('../utils/responseHandler');

/**
 * Global error handler middleware
 * @param {Error} err - The error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  return responseHandler.error(res, message, statusCode);
};

module.exports = { errorHandler };
