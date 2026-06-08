const express = require('express');
const orderController = require('../controllers/order.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { createOrderValidation } = require('../validations/order.validation');

const router = express.Router();

router.get('/user/:userId', verifyToken, orderController.getByUserId);
router.get('/:orderId', verifyToken, orderController.getById);
router.post('/', verifyToken, validate(createOrderValidation, 'body'), orderController.createOrder);

module.exports = router;
