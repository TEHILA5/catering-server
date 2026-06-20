const express = require('express');
const orderController = require('../controllers/order.controller');
const { verifyToken, requireAdmin } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { createOrderValidation, updateOrderValidation, customerUpdateOrderValidation, dateRangeValidation } = require('../validations/order.validation');

const router = express.Router();

// Admin: all orders
router.get('/', verifyToken, requireAdmin, orderController.getAllOrders);

// Static / multi-segment paths must be registered before /:orderId to avoid conflicts.
router.get('/user/count', verifyToken, orderController.getOrderCountByUser);
router.get('/user/total', verifyToken, orderController.getTotalPaymentsByUser);
router.get('/stats/average', verifyToken, orderController.getAverageOrderValue);
router.get('/by-date-range', verifyToken, validate(dateRangeValidation, 'query'), orderController.getOrdersByDateRange);
router.get('/user/orders', verifyToken, orderController.getByUserId);
router.get('/customer/:customerId', verifyToken, requireAdmin, orderController.getOrdersByCustomer);
router.get('/:orderId/full-details', verifyToken, orderController.getFullOrderDetails);

router.post('/', verifyToken, validate(createOrderValidation, 'body'), orderController.createOrder);

// Sub-paths on /:orderId — register before bare /:orderId handlers.
router.patch('/:orderId/confirm-payment', verifyToken, requireAdmin, orderController.confirmPayment);
router.put('/:orderId/edit', verifyToken, validate(customerUpdateOrderValidation, 'body'), orderController.updateOrderByCustomer);

router.get('/:orderId', verifyToken, orderController.getById);
router.put('/:orderId', verifyToken, requireAdmin, validate(updateOrderValidation, 'body'), orderController.updateOrder);
router.delete('/:orderId', verifyToken, orderController.deleteOrder);

module.exports = router;
