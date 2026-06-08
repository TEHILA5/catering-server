const bcrypt = require('bcrypt');
const generateToken = require('../utils/generateToken');

/**
 * Login service - authenticates user and generates JWT token
 * @param {Object} User - The User model
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Object} { user, token }
 * @throws {Error} Invalid credentials or user not found
 */
const login = async (User, email, password) => {
  // Find user by email
  const user = await User.findOne({ email });
  
  if (!user) {
    throw new Error('Invalid credentials');
  }

  // Compare password with bcrypt
  const isPasswordValid = await bcrypt.compare(password, user.password);
  
  if (!isPasswordValid) {
    throw new Error('Invalid credentials');
  }

  // Generate JWT token
  const token = generateToken(user._id.toString(), user.role);

  // Return user (without password) and token
  const userResponse = user.toObject();
  delete userResponse.password;

  return {
    user: userResponse,
    token
  };
};

module.exports = { login };
