const jwt = require('jsonwebtoken');

/**
 * Generates a JWT token for the user
 * @param {string} userId - The user's ID
 * @param {string} role - The user's role
 * @returns {string} The JWT token
 */
const generateToken = (userId, role) => {
  const token = jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
  return token;
};

module.exports = generateToken;
