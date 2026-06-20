const { client, checkoutSdk } = require('../config/paypal.config');
const Order = require('../models/Order');
const orderService = require('./order.service');

// PayPal supports ILS as a transaction currency, so we charge in shekels to match
// the prices shown across the app (₪). Centralised here in case it ever changes.
const CURRENCY = 'ILS';

const PAYMENT_STATUS_PENDING = orderService.ORDER_STATUS_PENDING;
const PAYMENT_STATUS_PAID = orderService.ORDER_STATUS_APPROVED;

/**
 * Creates a PayPal order for one of our internal orders.
 * The amount is taken from the order stored in our DB (server-side source of truth) —
 * never from anything the client sends.
 *
 * @param {string} orderId  our internal Order _id
 * @param {string} userId   the authenticated user (must own the order)
 * @returns {Promise<{ paypalOrderId: string }>}
 */
const createPaypalOrder = async (orderId, userId) => {
  const order = await Order.findById(orderId);
  if (!order) throw new Error('Order not found');
  if (order.userId.toString() !== userId.toString()) {
    throw new Error('Unauthorized: you can only pay for your own orders');
  }

  const amount = Number(order.totalPrice);
  if (!amount || amount <= 0) {
    throw new Error('Invalid order amount');
  }

  const request = new checkoutSdk.orders.OrdersCreateRequest();
  request.prefer('return=representation');
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [
      {
        // Ties the PayPal order back to our internal order for reconciliation.
        custom_id: order._id.toString(),
        amount: {
          currency_code: CURRENCY,
          value: amount.toFixed(2),
        },
      },
    ],
  });

  const response = await client.execute(request);
  const paypalOrderId = response.result.id;

  // Persist the PayPal reference so capture can be validated against it later.
  order.paypalOrderId = paypalOrderId;
  await order.save();

  return { paypalOrderId };
};

/**
 * Captures a previously approved PayPal order and, ONLY on a confirmed successful
 * capture, marks our internal order as confirmed ("מאושר").
 *
 * @param {string} paypalOrderId  the PayPal order id returned by createPaypalOrder
 * @param {string} orderId        our internal Order _id
 * @param {string} userId         the authenticated user (must own the order)
 * @returns {Promise<{ success: boolean, status: string, order: object }>}
 */
const capturePaypalOrder = async (paypalOrderId, orderId, userId) => {
  const order = await Order.findById(orderId);
  if (!order) throw new Error('Order not found');
  if (order.userId.toString() !== userId.toString()) {
    throw new Error('Unauthorized: you can only pay for your own orders');
  }
  // Guard against capturing a PayPal order that wasn't created for this order.
  if (order.paypalOrderId && order.paypalOrderId !== paypalOrderId) {
    throw new Error('PayPal order does not match this order');
  }

  const request = new checkoutSdk.orders.OrdersCaptureRequest(paypalOrderId);
  request.requestBody({});

  const response = await client.execute(request);
  const result = response.result;

  // The capture is only trustworthy when PayPal itself reports COMPLETED.
  const capture = result?.purchase_units?.[0]?.payments?.captures?.[0];
  const isCompleted = result?.status === 'COMPLETED' && capture?.status === 'COMPLETED';

  if (!isCompleted) {
    return { success: false, status: result?.status || 'FAILED', order };
  }

  // Confirm the order through the shared service so the status update and the
  // "order confirmed" email happen in exactly one place.
  const confirmedOrder = await orderService.markOrderConfirmed(orderId, {
    paypalCaptureId: capture.id,
  });

  return { success: true, status: result.status, order: confirmedOrder };
};

module.exports = {
  createPaypalOrder,
  capturePaypalOrder,
  PAYMENT_STATUS_PENDING,
  PAYMENT_STATUS_PAID,
  CURRENCY,
};
