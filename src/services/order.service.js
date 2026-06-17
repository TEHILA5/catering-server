const Order = require('../models/Order');
const Package = require('../models/Package');
const Dish = require('../models/Dish');
const User = require('../models/User');
const { sendEmail } = require('../config/email.config');

const getById = async (orderId) => {
  const order = await Order.findById(orderId)
    .populate('userId', 'name email')
    .populate('packageId', 'packageName')
    .populate('selectedItems', 'name');

  if (!order) throw new Error('Order not found');
  return order;
};

const getFullOrderDetails = async (orderId) => {
  const order = await Order.findById(orderId)
    .populate('userId', 'name email phone role')
    .populate('packageId', 'packageName description pricePerPerson limits')
    .populate('selectedItems', 'name description category imageUrl');

  if (!order) throw new Error('Order not found');
  return order;
};

const getAllOrders = async () => {
  const orders = await Order.find()
    .populate('userId', 'name email')
    .populate('packageId', 'packageName')
    .sort({ createdAt: -1 });
  return orders;
};

const getByUserId = async (userId) => {
  const orders = await Order.find({ userId })
    .populate('userId', 'name email')
    .populate('packageId', 'packageName')
    .populate('selectedItems', 'name');

  return orders;
};

const createOrder = async (data) => {
  const { userId, packageId, selectedItems = [], numberOfGuests, eventDate, address } = data;

  const selectedPackage = await Package.findById(packageId);
  if (!selectedPackage) throw new Error('Package not found');

  await validateSelectionAgainstLimits(selectedItems, selectedPackage.limits);

  // Price snapshot computed on the server, never trusted from the client.
  const totalPrice = selectedPackage.pricePerPerson * numberOfGuests;

  const order = await Order.create({
    userId,
    packageId,
    selectedItems,
    numberOfGuests,
    eventDate,
    address,
    totalPrice
  });

  // Keep the reverse reference in sync so user orders can be read without a separate query.
  await User.findByIdAndUpdate(userId, { $push: { orders: order._id } });

  // Send a confirmation email to the customer. A failure here must never fail order creation.
  try {
    const user = await User.findById(userId).select('name email');
    if (user?.email) {
      await sendEmail({
        to: user.email,
        subject: `אישור הזמנה - מספר ${order._id}`,
        html: buildOrderConfirmationHtml(order, user.name)
      });
    }
  } catch (error) {
    console.error('✗ Failed to send order confirmation email:', error.message);
  }

  const populatedOrder = await order.populate([
    { path: 'userId', select: 'name email' },
    { path: 'packageId', select: 'packageName' },
    { path: 'selectedItems', select: 'name' }
  ]);

  return populatedOrder;
};

const validateSelectionAgainstLimits = async (selectedItemIds, limits) => {
  if (!selectedItemIds.length) return;

  const dishes = await Dish.find({ _id: { $in: selectedItemIds } });
  if (dishes.length !== selectedItemIds.length) {
    throw new Error('One or more selected dishes do not exist');
  }

  const countByCategory = {};
  for (const dish of dishes) {
    countByCategory[dish.category] = (countByCategory[dish.category] || 0) + 1;
  }

  for (const [category, count] of Object.entries(countByCategory)) {
    const allowed = limits?.[category] ?? 0;
    if (count > allowed) {
      throw new Error(`Selected ${count} items in '${category}' but the package allows only ${allowed}`);
    }
  }
};

const deleteOrder = async (orderId) => {
  const order = await Order.findByIdAndDelete(orderId);
  if (!order) throw new Error('Order not found');

  // Keep the reverse reference in sync.
  await User.findByIdAndUpdate(order.userId, { $pull: { orders: order._id } });
  return order;
};

const updateOrder = async (orderId, data) => {
  const existing = await Order.findById(orderId);
  if (!existing) throw new Error('Order not found');
  if (existing.isApproved) throw new Error('Cannot edit an order that has already been approved');

  const updateData = { ...data };

  const targetPackageId = data.packageId ?? existing.packageId;
  const targetGuests = data.numberOfGuests ?? existing.numberOfGuests;

  if (data.packageId || data.selectedItems !== undefined || data.numberOfGuests) {
    const pkg = await Package.findById(targetPackageId);
    if (!pkg) throw new Error('Package not found');

    const items = data.selectedItems ?? existing.selectedItems.map((id) => id.toString());
    if (data.packageId || data.selectedItems !== undefined) {
      await validateSelectionAgainstLimits(items, pkg.limits);
    }
    updateData.totalPrice = pkg.pricePerPerson * targetGuests;
  }

  const order = await Order.findByIdAndUpdate(orderId, updateData, { new: true })
    .populate('userId', 'name email')
    .populate('packageId', 'packageName')
    .populate('selectedItems', 'name');

  if (!order) throw new Error('Order not found');
  return order;
};

// Customer-initiated update: enforces ownership and blocks isApproved changes.
const updateOrderByCustomer = async (orderId, userId, data) => {
  const existing = await Order.findById(orderId);
  if (!existing) throw new Error('Order not found');
  if (existing.userId.toString() !== userId.toString()) {
    throw new Error('Unauthorized: you can only edit your own orders');
  }
  if (existing.isApproved) throw new Error('Cannot edit an order that has already been approved');

  const updateData = { ...data };

  const targetPackageId = data.packageId ?? existing.packageId;
  const targetGuests = data.numberOfGuests ?? existing.numberOfGuests;

  if (data.packageId || data.selectedItems !== undefined || data.numberOfGuests) {
    const pkg = await Package.findById(targetPackageId);
    if (!pkg) throw new Error('Package not found');

    const items = data.selectedItems ?? existing.selectedItems.map((id) => id.toString());
    if (data.packageId || data.selectedItems !== undefined) {
      await validateSelectionAgainstLimits(items, pkg.limits);
    }
    updateData.totalPrice = pkg.pricePerPerson * targetGuests;
  }

  const order = await Order.findByIdAndUpdate(orderId, updateData, { new: true })
    .populate('userId', 'name email')
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

const getAverageOrderValue = async () => {
  const result = await Order.aggregate([
    { $group: { _id: null, averageOrderValue: { $avg: '$totalPrice' } } }
  ]);

  return result.length > 0 ? result[0].averageOrderValue : 0;
};

const getOrdersByDateRange = async (startDate, endDate) => {
  const orders = await Order.find({
    eventDate: { $gte: startDate, $lte: endDate }
  })
    .populate('userId', 'name email')
    .populate('packageId', 'packageName')
    .populate('selectedItems', 'name');

  return orders;
};

// Builds the styled Hebrew (RTL) HTML body for the order confirmation email.
const buildOrderConfirmationHtml = (order, customerName) => {
  const eventDate = new Date(order.eventDate).toLocaleDateString('he-IL');
  // The Order schema tracks approval via `isApproved`; surface it as a readable status.
  const status = order.isApproved ? 'מאושרת' : 'ממתינה לאישור';

  return `
    <div style="direction: rtl; font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
      <div style="background-color: white; padding: 30px; border-radius: 8px; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; text-align: center; margin-bottom: 30px;">אישור הזמנה</h2>

        <p style="color: #555; font-size: 16px; margin-bottom: 20px;">שלום <strong>${customerName}</strong>,</p>

        <p style="color: #555; font-size: 16px; margin-bottom: 30px;">תודה על הזמנתך! הנה פרטי ההזמנה:</p>

        <div style="background-color: #f9f9f9; padding: 20px; border-right: 4px solid #4CAF50; margin-bottom: 20px;">
          <p style="margin: 10px 0;"><strong>מספר הזמנה:</strong> ${order._id}</p>
          <p style="margin: 10px 0;"><strong>תאריך האירוע:</strong> ${eventDate}</p>
          <p style="margin: 10px 0;"><strong>כתובת:</strong> ${order.address}</p>
          <p style="margin: 10px 0;"><strong>מחיר כולל:</strong> ₪${order.totalPrice}</p>
          <p style="margin: 10px 0;"><strong>סטטוס:</strong> ${status}</p>
        </div>

        <p style="color: #555; font-size: 16px; margin-bottom: 20px;">תודה רבה שבחרת בנו! נחזור אליך בהקדם עם עדכון על ההזמנה.</p>

        <p style="color: #999; font-size: 14px; text-align: center; margin-top: 30px;">בברכה,<br/>צוות הקייטרינג</p>
      </div>
    </div>
  `;
};

module.exports = { getAllOrders, getById, getFullOrderDetails, getByUserId, createOrder, deleteOrder, updateOrder, updateOrderByCustomer, getOrderCountByUser, getTotalPaymentsByUser, getAverageOrderValue, getOrdersByDateRange };
