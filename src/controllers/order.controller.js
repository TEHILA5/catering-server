const orderService = require('../services/order.service');
const responseHandler = require('../utils/responseHandler');

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

const getByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const orders = await orderService.getByUserId(userId);
    return responseHandler.success(res, orders, 'User orders retrieved successfully', 200);
  } catch (error) {
    return responseHandler.error(res, error.message || 'Failed to retrieve user orders', 500);
  }
};

const createOrder = async (req, res) => {
  try {
    const { userId, packageId, selectedItems, eventDate, address, totalPrice } = req.body;
    const order = await orderService.createOrder({
      userId,
      packageId,
      selectedItems,
      eventDate,
      address,
      totalPrice
    });
    return responseHandler.success(res, order, 'Order created successfully', 201);
  } catch (error) {
    return responseHandler.error(res, error.message || 'Failed to create order', 500);
  }
};

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

const updateOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await orderService.updateOrder(orderId, req.body);
    return responseHandler.success(res, order, 'Order updated successfully', 200);
  } catch (error) {
    if (error.message.includes('Order not found')) {
      return responseHandler.error(res, error.message, 404);
    }
    return responseHandler.error(res, error.message || 'Failed to update order', 500);
  }
};

const getOrderCountByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const count = await orderService.getOrderCountByUser(userId);
    return responseHandler.success(res, { count }, 'Order count retrieved successfully', 200);
  } catch (error) {
    return responseHandler.error(res, error.message || 'Failed to retrieve order count', 500);
  }
};

const getTotalPaymentsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await orderService.getTotalPaymentsByUser(userId);
    return responseHandler.success(res, result, 'Total payments retrieved successfully', 200);
  } catch (error) {
    return responseHandler.error(res, error.message || 'Failed to retrieve total payments', 500);
  }
};

module.exports = { getById, getByUserId, createOrder, deleteOrder, updateOrder, getOrderCountByUser, getTotalPaymentsByUser };
