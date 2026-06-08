const bcrypt = require('bcrypt');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

/**
 * Register a new user
 * @param {string} fullName - User's full name
 * @param {string} email - User's email address
 * @param {string} password - User's password (plain text)
 * @returns {Promise<{user: Object, token: string}>} User object and JWT token
 * @throws {Error} If email already exists or registration fails
 */
const register = async (fullName, email, password) => {
  // Check if email already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error('Email already in use');
  }

  // Hash password with bcrypt (10 salt rounds)
  const hashPassword = await bcrypt.hash(password, 10);

  // Create user
  const newUser = await User.create({
    fullName,
    email,
    hashPassword
  });

  // Generate JWT token
  const token = generateToken(newUser._id, newUser.role);

  // Return user without hashPassword
  const userResponse = {
    _id: newUser._id,
    fullName: newUser.fullName,
    email: newUser.email,
    phone: newUser.phone,
    role: newUser.role,
    createdAt: newUser.createdAt
  };

  return { user: userResponse, token };
};

/**
 * Get user profile
 * @param {string} userId - User ID from JWT token
 * @returns {Promise<Object>} User object without hashPassword
 * @throws {Error} If user not found
 */
const getProfile = async (userId) => {
  const user = await User.findById(userId).select('-hashPassword');

  if (!user) {
    throw new Error('User not found');
  }

  return user;
};

module.exports = {
  register,
  getProfile
};
