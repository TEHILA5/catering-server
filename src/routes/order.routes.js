const express = require('express');
const orderController = require('../controllers/order.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { createOrderValidation, updateOrderValidation, dateRangeValidation } = require('../validations/order.validation');

const router = express.Router();

// PART 2 routes - must be before /:orderId to avoid route matching conflicts
router.get('/user/:userId/count', verifyToken, orderController.getOrderCountByUser);
router.get('/user/:userId/total', verifyToken, orderController.getTotalPaymentsByUser);
router.get('/stats/average', verifyToken, orderController.getAverageOrderValue);
router.get('/by-date-range', verifyToken, validate(dateRangeValidation, 'query'), orderController.getOrdersByDateRange);

router.get('/user/:userId', verifyToken, orderController.getByUserId);
router.get('/:orderId', verifyToken, orderController.getById);
router.post('/', verifyToken, validate(createOrderValidation, 'body'), orderController.createOrder);

router.delete('/:orderId', verifyToken, orderController.deleteOrder);
router.put('/:orderId', verifyToken, validate(updateOrderValidation, 'body'), orderController.updateOrder);

module.exports = router;
