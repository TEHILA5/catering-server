const responseHandler = require('../utils/responseHandler');
const authService = require('../services/auth.service');

/**
 * Register a new user
 * @route POST /api/auth/register
 * @param {Object} req - Express request object
 * @param {string} req.body.fullName - User's full name
 * @param {string} req.body.email - User's email address
 * @param {string} req.body.password - User's password
 * @param {Object} res - Express response object
 */
const register = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    const { user, token } = await authService.register(fullName, email, password);

    return responseHandler.success(
      res,
      { user, token },
      'User registered successfully',
      201
    );
  } catch (error) {
    if (error.message.includes('Email already in use')) {
      return responseHandler.error(res, error.message, 409);
    }

    return responseHandler.error(res, error.message || 'Registration failed', 500);
  }
};

/**
 * Get user profile
 * @route GET /api/auth/profile
 * @param {Object} req - Express request object
 * @param {string} req.user.id - User ID from JWT token
 * @param {Object} res - Express response object
 */
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await authService.getProfile(userId);

    return responseHandler.success(
      res,
      user,
      'Profile retrieved successfully',
      200
    );
  } catch (error) {
    if (error.message.includes('User not found')) {
      return responseHandler.error(res, error.message, 404);
    }

    return responseHandler.error(res, error.message || 'Failed to retrieve profile', 500);
  }
};

module.exports = {
  register,
  getProfile
};
