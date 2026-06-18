const responseHandler = require('../utils/responseHandler');
const authService = require('../services/auth.service');

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    const { user, token } = await authService.register(name, email, password, phone);
    return responseHandler.success(res, { user, token }, 'User registered successfully', 201);
  } catch (error) {
    if (error.message.includes('Email already in use')) {
      return responseHandler.error(res, error.message, 409);
    }
    return responseHandler.error(res, error.message || 'Registration failed', 500);
  }
};

// POST /api/auth/login
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

// GET /api/auth/profile
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

// PUT /api/auth/profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await authService.updateProfile(userId, req.body);
    return responseHandler.success(res, user, 'Profile updated successfully', 200);
  } catch (error) {
    if (error.message.includes('User not found')) {
      return responseHandler.error(res, error.message, 404);
    }
    if (error.message.includes('Email already in use')) {
      return responseHandler.error(res, error.message, 409);
    }
    return responseHandler.error(res, error.message || 'Failed to update profile', 500);
  }
};

// GET /api/auth/users
const getAllUsers = async (req, res) => {
  try {
    const users = await authService.getAllUsers();
    return responseHandler.success(res, users, 'All users retrieved successfully', 200);
  } catch (error) {
    return responseHandler.error(res, error.message || 'Failed to retrieve users', 500);
  }
};

module.exports = { register, login, getProfile, updateProfile, getAllUsers };
