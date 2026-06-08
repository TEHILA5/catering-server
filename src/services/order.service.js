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

const deleteOrder = async (orderId) => {
  const order = await Order.findByIdAndDelete(orderId);
  if (!order) throw new Error('Order not found');
  return order;
};

const updateOrder = async (orderId, data) => {
  const order = await Order.findByIdAndUpdate(orderId, data, { new: true })
    .populate('userId', 'fullName email')
    .populate('packageId', 'packageName')
    .populate('selectedItems', 'name');

  if (!order) throw new Error('Order not found');
  return order;
};

const getOrderCountByUser = async (userId) => {
  const count = await Order.countDocuments({ userId });
  return count;
};

const getTotalPaymentsByUser = async (userId) => {
  const result = await Order.aggregate([
    { $match: { userId: require('mongoose').Types.ObjectId(userId) } },
    { $group: { _id: null, totalPayments: { $sum: '$totalPrice' } } }
  ]);

  const totalPayments = result.length > 0 ? result[0].totalPayments : 0;
  return { userId, totalPayments };
};

module.exports = { getById, getByUserId, createOrder, deleteOrder, updateOrder, getOrderCountByUser, getTotalPaymentsByUser };
