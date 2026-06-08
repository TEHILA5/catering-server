const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { validate } = require('../middlewares/validation.middleware');
const { verifyToken } = require('../middlewares/auth.middleware');
const { registerValidation } = require('../validations/auth.validation');


router.post(
  '/register',
  validate(registerValidation, 'body'),
  authController.register
);


router.get(
  '/profile',
  verifyToken,
  authController.getProfile
);

module.exports = router;
