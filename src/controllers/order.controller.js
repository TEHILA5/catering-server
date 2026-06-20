const orderService = require('../services/order.service');
const responseHandler = require('../utils/responseHandler');

// GET /api/orders  (admin only)
const getAllOrders = async (req, res) => {
  try {
    const orders = await orderService.getAllOrders();
    return responseHandler.success(res, orders, 'Orders retrieved successfully', 200);
  } catch (error) {
    return responseHandler.error(res, error.message || 'Failed to retrieve orders', 500);
  }
};

// GET /api/orders/:orderId
const getById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await orderService.getById(orderId);
    return responseHandler.success(res, order, 'Order retrieved successfully', 200);
  } catch (error) {
    if (error.message.includes('Order not found')) {
      return responseHandler.error(res, error.message, 404);
    }
    return responseHandler.error(res, error.message || 'Failed to retrieve order', 500);
  }
};

// GET /api/orders/:orderId/full-details
const getFullOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await orderService.getFullOrderDetails(orderId);
    return responseHandler.success(res, order, 'Full order details retrieved successfully', 200);
  } catch (error) {
    if (error.message.includes('Order not found')) {
      return responseHandler.error(res, error.message, 404);
    }
    return responseHandler.error(res, error.message || 'Failed to retrieve order', 500);
  }
};

// GET /api/orders/user/orders
const getByUserId = async (req, res) => {
  try {
    const userId = req.user.id;
    const orders = await orderService.getByUserId(userId);
    return responseHandler.success(res, orders, 'User orders retrieved successfully', 200);
  } catch (error) {
    return responseHandler.error(res, error.message || 'Failed to retrieve user orders', 500);
  }
};

// GET /api/orders/customer/:customerId  (admin only)
const getOrdersByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    const orders = await orderService.getByCustomerId(customerId);
    return responseHandler.success(res, orders, 'Customer orders retrieved successfully', 200);
  } catch (error) {
    return responseHandler.error(res, error.message || 'Failed to retrieve customer orders', 500);
  }
};

// POST /api/orders
const createOrder = async (req, res) => {
  try {
    const { packageId, selectedItems, numberOfGuests, eventDate, address } = req.body;
    const order = await orderService.createOrder({
      userId: req.user.id,
      packageId,
      selectedItems,
      numberOfGuests,
      eventDate,
      address
    });
    return responseHandler.success(res, order, 'Order created successfully', 201);
  } catch (error) {
    return responseHandler.error(res, error.message || 'Failed to create order', 500);
  }
};

// DELETE /api/orders/:orderId
const deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await orderService.deleteOrder(orderId);
    return responseHandler.success(res, order, 'Order deleted successfully', 200);
  } catch (error) {
    if (error.message.includes('Order not found')) {
      return responseHandler.error(res, error.message, 404);
    }
    return responseHandler.error(res, error.message || 'Failed to delete order', 500);
  }
};

// PUT /api/orders/:orderId  (admin only)
const updateOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await orderService.updateOrder(orderId, req.body);
    return responseHandler.success(res, order, 'Order updated successfully', 200);
  } catch (error) {
    if (error.message.includes('Order not found')) {
      return responseHandler.error(res, error.message, 404);
    }
    if (error.message.includes('approved')) {
      return responseHandler.error(res, error.message, 409);
    }
    return responseHandler.error(res, error.message || 'Failed to update order', 500);
  }
};

// PUT /api/orders/:orderId/edit  (authenticated customer — must own the order)
const updateOrderByCustomer = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await orderService.updateOrderByCustomer(orderId, req.user.id, req.body);
    return responseHandler.success(res, order, 'Order updated successfully', 200);
  } catch (error) {
    if (error.message.includes('Order not found')) {
      return responseHandler.error(res, error.message, 404);
    }
    if (error.message.includes('Unauthorized')) {
      return responseHandler.error(res, error.message, 403);
    }
    if (error.message.includes('approved')) {
      return responseHandler.error(res, error.message, 409);
    }
    return responseHandler.error(res, error.message || 'Failed to update order', 500);
  }
};

// PATCH /api/orders/:orderId/confirm-payment  (admin only)
// Manually marks an order as paid (cash / bank transfer) — no PayPal involved.
const confirmPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await orderService.markOrderConfirmed(orderId);
    return responseHandler.success(res, order, 'Payment confirmed successfully', 200);
  } catch (error) {
    if (error.message.includes('Order not found')) {
      return responseHandler.error(res, error.message, 404);
    }
    return responseHandler.error(res, error.message || 'Failed to confirm payment', 500);
  }
};

// GET /api/orders/user/count
const getOrderCountByUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await orderService.getOrderCountByUser(userId);
    return responseHandler.success(res, { count }, 'Order count retrieved successfully', 200);
  } catch (error) {
    return responseHandler.error(res, error.message || 'Failed to retrieve order count', 500);
  }
};

// GET /api/orders/user/total
const getTotalPaymentsByUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await orderService.getTotalPaymentsByUser(userId);
    return responseHandler.success(res, result, 'Total payments retrieved successfully', 200);
  } catch (error) {
    return responseHandler.error(res, error.message || 'Failed to retrieve total payments', 500);
  }
};

// GET /api/orders/stats/average
const getAverageOrderValue = async (req, res) => {
  try {
    const averageOrderValue = await orderService.getAverageOrderValue();
    return responseHandler.success(res, { averageOrderValue }, 'Average order value retrieved successfully', 200);
  } catch (error) {
    return responseHandler.error(res, error.message || 'Failed to retrieve average order value', 500);
  }
};

// GET /api/orders/by-date-range
const getOrdersByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Validate dates
    if (!startDate || !endDate) {
      return responseHandler.error(res, 'Both startDate and endDate are required', 400);
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return responseHandler.error(res, 'Invalid date format. Use valid ISO date strings', 400);
    }

    const orders = await orderService.getOrdersByDateRange(start, end);
    return responseHandler.success(res, orders, 'Orders retrieved successfully', 200);
  } catch (error) {
    return responseHandler.error(res, error.message || 'Failed to retrieve orders by date range', 500);
  }
};

module.exports = { getAllOrders, getById, getFullOrderDetails, getByUserId, getOrdersByCustomer, createOrder, deleteOrder, updateOrder, updateOrderByCustomer, confirmPayment, getOrderCountByUser, getTotalPaymentsByUser, getAverageOrderValue, getOrdersByDateRange };
