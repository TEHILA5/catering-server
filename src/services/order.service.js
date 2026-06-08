const Order = require('../models/Order');

const getById = async (orderId) => {
  const order = await Order.findById(orderId)
    .populate('userId', 'fullName email')
    .populate('packageId', 'packageName')
    .populate('selectedItems', 'name');

  if (!order) throw new Error('Order not found');
  return order;
};

const getByUserId = async (userId) => {
  const orders = await Order.find({ userId })
    .populate('userId', 'fullName email')
    .populate('packageId', 'packageName')
    .populate('selectedItems', 'name');

  return orders;
};

const createOrder = async (data) => {
  const order = await Order.create(data);
  const populatedOrder = await order.populate([
    { path: 'userId', select: 'fullName email' },
    { path: 'packageId', select: 'packageName' },
    { path: 'selectedItems', select: 'name' }
  ]);

  return populatedOrder;
};

module.exports = { getById, getByUserId, createOrder };
