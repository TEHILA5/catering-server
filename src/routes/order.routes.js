const express = require('express');
const orderController = require('../controllers/order.controller');
const { verifyToken, requireAdmin } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { createOrderValidation, updateOrderValidation, customerUpdateOrderValidation, dateRangeValidation } = require('../validations/order.validation');

const router = express.Router();

// Admin: all orders
router.get('/', verifyToken, requireAdmin, orderController.getAllOrders);

// PART 2 routes - must be before /:orderId to avoid route matching conflicts
router.get('/user/count', verifyToken, orderController.getOrderCountByUser);
router.get('/user/total', verifyToken, orderController.getTotalPaymentsByUser);
router.get('/stats/average', verifyToken, orderController.getAverageOrderValue);
router.get('/by-date-range', verifyToken, validate(dateRangeValidation, 'query'), orderController.getOrdersByDateRange);
router.get('/:orderId/full-details', verifyToken, orderController.getFullOrderDetails);

router.get('/user/orders', verifyToken, orderController.getByUserId);
router.get('/:orderId', verifyToken, orderController.getById);
router.post('/', verifyToken, validate(createOrderValidation, 'body'), orderController.createOrder);

router.delete('/:orderId', verifyToken, orderController.deleteOrder);

// Admin: full update including approval status.
router.put('/:orderId', verifyToken, requireAdmin, validate(updateOrderValidation, 'body'), orderController.updateOrder);

// Customer: edit own pending order (cannot change isApproved).
router.put('/:orderId/edit', verifyToken, validate(customerUpdateOrderValidation, 'body'), orderController.updateOrderByCustomer);

module.exports = router;
