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
    .populate('userId', 'fullName email phone role')
    .populate('packageId', 'packageName description pricePerPerson limits')
    .populate('selectedItems', 'name description category imageUrl');

  if (!order) throw new Error('Order not found');
  return order;
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

  const populatedOrder = await order.populate([
    { path: 'userId', select: 'name email' },
    { path: 'packageId', select: 'packageName' },
    { path: 'selectedItems', select: 'name' }
  ]);

  // Send confirmation email asynchronously (non-blocking)
  sendConfirmationEmail(populatedOrder).catch((error) => {
    console.error('✗ Failed to send order confirmation email:', error.message);
  });

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
  const order = await Order.findByIdAndUpdate(orderId, data, { new: true })
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

const sendConfirmationEmail = async (order) => {
  try {
    const customerEmail = order.userId.email;
    const customerName = order.userId.name;
    const orderId = order._id.toString();
    const eventDate = new Date(order.eventDate).toLocaleDateString('he-IL');
    const packageName = order.packageId.packageName;
    const selectedItemsNames = order.selectedItems.map((item) => item.name).join(', ');

    const emailBody = `
      <div style="direction: rtl; font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; text-align: center; margin-bottom: 30px;">אישור הזמנה</h2>
          
          <p style="color: #555; font-size: 16px; margin-bottom: 20px;">שלום <strong>${customerName}</strong>,</p>
          
          <p style="color: #555; font-size: 16px; margin-bottom: 30px;">תודה על הזמנתך! הנה פרטי ההזמנה:</p>
          
          <div style="background-color: #f9f9f9; padding: 20px; border-right: 4px solid #4CAF50; margin-bottom: 20px;">
            <p style="margin: 10px 0;"><strong>מספר הזמנה:</strong> ${orderId}</p>
            <p style="margin: 10px 0;"><strong>תאריך האירוע:</strong> ${eventDate}</p>
            <p style="margin: 10px 0;"><strong>כתובת:</strong> ${order.address}</p>
            <p style="margin: 10px 0;"><strong>חבילה:</strong> ${packageName}</p>
            <p style="margin: 10px 0;"><strong>פריטים נבחרים:</strong> ${selectedItemsNames}</p>
            <p style="margin: 10px 0;"><strong>מחיר כולל:</strong> ₪${order.totalPrice}</p>
          </div>
          
          <p style="color: #555; font-size: 16px; margin-bottom: 20px;">ההזמנה שלך בהמתנה לאישור. אנחנו נבדוק את הפרטים ונחזור אליך בקרוב.</p>
          
          <p style="color: #999; font-size: 14px; text-align: center; margin-top: 30px;">בברכה,<br/>צוות הקייטרינג</p>
        </div>
      </div>
    `;

    await sendEmail({
      to: customerEmail,
      subject: 'אישור הזמנה - קייטרינג',
      html: emailBody,
      text: `אישור הזמנה: ${orderId}`
    });
  } catch (error) {
    throw error;
  }
};

module.exports = { getById, getByUserId, createOrder, deleteOrder, updateOrder, getOrderCountByUser, getTotalPaymentsByUser, getAverageOrderValue, getOrdersByDateRange };
