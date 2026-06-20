const Order = require('../models/Order');
const Package = require('../models/Package');
const Dish = require('../models/Dish');
const User = require('../models/User');
const { sendEmail } = require('../config/email.config');

// Canonical order statuses. These are the single source of truth shared across
// the order service, the PayPal capture flow and the admin confirm-payment flow.
const ORDER_STATUS_PENDING = 'ממתין לתשלום';
const ORDER_STATUS_APPROVED = 'מאושר';

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

const getByUserId = async (userId) => {
  const orders = await Order.find({ userId })
    .populate('userId', 'name email')
    .populate('packageId', 'packageName')
    .populate('selectedItems', 'name')
    .sort({ createdAt: -1 });

  return orders;
};

// Admin: orders belonging to a specific customer (by user id).
const getByCustomerId = async (customerId) => {
  const orders = await Order.find({ userId: customerId })
    .populate('userId', 'name email')
    .populate('packageId', 'packageName')
    .populate('selectedItems', 'name')
    .sort({ createdAt: -1 });

  return orders;
};

const getAllOrders = async () => {
  const orders = await Order.find()
    .populate('userId', 'name email')
    .populate('packageId', 'packageName')
    .populate('selectedItems', 'name')
    .sort({ createdAt: -1 });

  return orders;
};

const createOrder = async (data) => {
  const { userId, packageId, selectedItems = [], numberOfGuests, eventDate, address } = data;

  const selectedPackage = await Package.findById(packageId);
  if (!selectedPackage) throw new Error('Package not found');

  // Never trust the client: reject any event date that has already passed.
  ensureEventDateNotInPast(eventDate);

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

  // Notify the customer that the order was received and is awaiting payment.
  // A failure here must never fail order creation.
  try {
    const user = await User.findById(userId).select('name email');
    if (user?.email) {
      await sendEmail({
        to: user.email,
        subject: `ההזמנה שלך התקבלת - מספר ${order._id}`,
        html: buildOrderCreatedHtml(order, user.name, selectedPackage.packageName)
      });
    }
  } catch (error) {
    console.error('✗ Failed to send order-created email:', error.message);
  }

  const populatedOrder = await order.populate([
    { path: 'userId', select: 'name email' },
    { path: 'packageId', select: 'packageName' },
    { path: 'selectedItems', select: 'name' }
  ]);

  return populatedOrder;
};

// Rejects an event date that falls before today (comparison is date-only, time ignored).
const ensureEventDateNotInPast = (eventDate) => {
  const parsed = new Date(eventDate);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('תאריך האירוע אינו תקין');
  }

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const startOfEventDate = new Date(parsed);
  startOfEventDate.setHours(0, 0, 0, 0);

  if (startOfEventDate < startOfToday) {
    throw new Error('לא ניתן לבחור תאריך שעבר');
  }
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
  if (existing.paymentStatus === ORDER_STATUS_APPROVED) {
    throw new Error('Cannot edit an order that has already been approved');
  }

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

// Customer-initiated update: enforces ownership; cannot change payment status.
const updateOrderByCustomer = async (orderId, userId, data) => {
  const existing = await Order.findById(orderId);
  if (!existing) throw new Error('Order not found');
  if (existing.userId.toString() !== userId.toString()) {
    throw new Error('Unauthorized: you can only edit your own orders');
  }
  if (existing.paymentStatus === ORDER_STATUS_APPROVED) {
    throw new Error('Cannot edit an order that has already been approved');
  }

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

// Marks an order as confirmed ("מאושר"). This is the single shared place that
// flips an order to confirmed and notifies the customer, so the logic is not
// duplicated between the PayPal capture flow and the admin manual-confirm flow.
//
// @param {string} orderId          our internal Order _id
// @param {object} [opts]
// @param {string} [opts.paypalCaptureId]  set when confirmation came from PayPal
// @returns {Promise<object>}        the populated, confirmed order
const markOrderConfirmed = async (orderId, { paypalCaptureId } = {}) => {
  const order = await Order.findById(orderId);
  if (!order) throw new Error('Order not found');

  // Idempotent: if it was already confirmed, don't send the email a second time.
  const alreadyConfirmed = order.paymentStatus === ORDER_STATUS_APPROVED;

  order.paymentStatus = ORDER_STATUS_APPROVED;
  if (paypalCaptureId) order.paypalCaptureId = paypalCaptureId;
  await order.save();

  const populatedOrder = await order.populate([
    { path: 'userId', select: 'name email' },
    { path: 'packageId', select: 'packageName' },
    { path: 'selectedItems', select: 'name' }
  ]);

  // Notify the customer that payment was received. A failed email must never
  // block the status update or the payment flow.
  if (!alreadyConfirmed) {
    try {
      const customer = populatedOrder.userId;
      if (customer?.email) {
        await sendEmail({
          to: customer.email,
          subject: `ההזמנה שלך אושרה! - מספר ${order._id}`,
          html: buildOrderConfirmedHtml(populatedOrder, customer.name, populatedOrder.packageId?.packageName)
        });
      }
    } catch (error) {
      console.error('✗ Failed to send order-confirmed email:', error.message);
    }
  }

  return populatedOrder;
};

// Shared, styled Hebrew (RTL) order-summary block reused by both emails.
const buildOrderSummaryBlock = (order, packageName) => {
  const eventDate = new Date(order.eventDate).toLocaleDateString('he-IL');

  return `
        <div style="background-color: #f9f9f9; padding: 20px; border-right: 4px solid #4CAF50; margin-bottom: 20px;">
          <p style="margin: 10px 0;"><strong>מספר הזמנה:</strong> ${order._id}</p>
          ${packageName ? `<p style="margin: 10px 0;"><strong>חבילה:</strong> ${packageName}</p>` : ''}
          <p style="margin: 10px 0;"><strong>תאריך האירוע:</strong> ${eventDate}</p>
          <p style="margin: 10px 0;"><strong>כתובת:</strong> ${order.address}</p>
          <p style="margin: 10px 0;"><strong>מספר אורחים:</strong> ${order.numberOfGuests}</p>
          <p style="margin: 10px 0;"><strong>מחיר כולל:</strong> ₪${order.totalPrice}</p>
        </div>`;
};

// Email sent immediately after an order is created — payment still pending.
const buildOrderCreatedHtml = (order, customerName, packageName) => {
  return `
    <div style="direction: rtl; font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
      <div style="background-color: white; padding: 30px; border-radius: 8px; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; text-align: center; margin-bottom: 30px;">ההזמנה שלך התקבלה</h2>

        <p style="color: #555; font-size: 16px; margin-bottom: 20px;">שלום <strong>${customerName}</strong>,</p>

        <p style="color: #555; font-size: 16px; margin-bottom: 30px;">תודה על הזמנתך! קיבלנו את ההזמנה שלך. הנה הפרטים:</p>
${buildOrderSummaryBlock(order, packageName)}
        <p style="color: #555; font-size: 16px; margin-bottom: 20px;">
          <strong>שים לב:</strong> ההזמנה ממתינה לתשלום. לאחר השלמת התשלום ההזמנה תאושר ותקבל הודעה נוספת.
        </p>

        <p style="color: #999; font-size: 14px; text-align: center; margin-top: 30px;">בברכה,<br/>צוות הקייטרינג</p>
      </div>
    </div>
  `;
};

// Email sent when an order becomes confirmed — payment received.
const buildOrderConfirmedHtml = (order, customerName, packageName) => {
  return `
    <div style="direction: rtl; font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
      <div style="background-color: white; padding: 30px; border-radius: 8px; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; text-align: center; margin-bottom: 30px;">ההזמנה שלך אושרה!</h2>

        <p style="color: #555; font-size: 16px; margin-bottom: 20px;">שלום <strong>${customerName}</strong>,</p>

        <p style="color: #555; font-size: 16px; margin-bottom: 30px;">קיבלנו את התשלום עבור הזמנתך וההזמנה אושרה. הנה הפרטים:</p>
${buildOrderSummaryBlock(order, packageName)}
        <p style="color: #555; font-size: 16px; margin-bottom: 20px;">תודה רבה שבחרת בנו! נתראה באירוע.</p>

        <p style="color: #999; font-size: 14px; text-align: center; margin-top: 30px;">בברכה,<br/>צוות הקייטרינג</p>
      </div>
    </div>
  `;
};

module.exports = { getAllOrders, getById, getFullOrderDetails, getByUserId, getByCustomerId, createOrder, deleteOrder, updateOrder, updateOrderByCustomer, markOrderConfirmed, getOrderCountByUser, getTotalPaymentsByUser, getAverageOrderValue, getOrdersByDateRange, ORDER_STATUS_PENDING, ORDER_STATUS_APPROVED };
