const responseHandler = require('../utils/responseHandler');
const { login: loginService } = require('../services/auth.service');
const User = require('../models/User');

/**
 * Login controller - handles user authentication
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const { user, token } = await loginService(User, email, password);

    return responseHandler.success(
      res,
      { user, token },
      'Login successful',
      200
    );
  } catch (error) {
    next(error);
  }
};

module.exports = { login };
