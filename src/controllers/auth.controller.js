const responseHandler = require('../utils/responseHandler');
const authService = require('../services/auth.service');

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const { user, token } = await authService.register(name, email, password);
    return responseHandler.success(res, { user, token }, 'User registered successfully', 201);
  } catch (error) {
    if (error.message.includes('Email already in use')) {
      return responseHandler.error(res, error.message, 409);
    }
    return responseHandler.error(res, error.message || 'Registration failed', 500);
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await authService.login(email, password);
    return responseHandler.success(res, { user, token }, 'Login successful', 200);
  } catch (error) {
    if (error.message.includes('Invalid credentials')) {
      return responseHandler.error(res, error.message, 401);
    }
    return responseHandler.error(res, error.message || 'Login failed', 500);
  }
};

const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await authService.getProfile(userId);
    return responseHandler.success(res, user, 'Profile retrieved successfully', 200);
  } catch (error) {
    if (error.message.includes('User not found')) {
      return responseHandler.error(res, error.message, 404);
    }
    return responseHandler.error(res, error.message || 'Failed to retrieve profile', 500);
  }
};

module.exports = { register, login, getProfile };
