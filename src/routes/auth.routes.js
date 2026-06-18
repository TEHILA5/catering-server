const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { validate } = require('../middlewares/validation.middleware');
const { verifyToken } = require('../middlewares/auth.middleware');
const { isAdmin } = require('../middlewares/admin.middleware');
const { registerValidation, loginValidation, updateProfileValidation } = require('../validations/auth.validation');

router.post('/register', validate(registerValidation, 'body'), authController.register);
router.post('/login', validate(loginValidation, 'body'), authController.login);
router.get('/profile', verifyToken, authController.getProfile);
router.put('/profile', verifyToken, validate(updateProfileValidation, 'body'), authController.updateProfile);
router.get('/users', verifyToken, isAdmin, authController.getAllUsers);

module.exports = router;
