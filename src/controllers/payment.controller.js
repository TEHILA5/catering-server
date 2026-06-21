const paymentService = require('../services/payment.service');
const responseHandler = require('../utils/responseHandler');

/**
 * Logs the *real* error behind a failed PayPal call instead of swallowing it.
 *
 * The @paypal/checkout-server-sdk throws an HttpError whose `statusCode` is the
 * HTTP status PayPal returned and whose `message` is the raw JSON body of the
 * error (e.g. { name: 'INVALID_REQUEST', details: [...] }). Previously only a
 * generic message bubbled up, so a 400 from PayPal was impossible to diagnose.
 *
 * @param {string} context  which operation failed (for log grep-ability)
 * @param {Error}  error    the thrown SDK / app error
 */
const logPaypalError = (context, error) => {
  const statusCode = error?.statusCode;

  // error.message is usually a JSON string from PayPal — try to pretty-print it
  // so the actual name / issue / description is visible in the console.
  let details = error?.message;
  try {
    details = JSON.parse(error.message);
  } catch {
    // Not JSON (an internal app error like "Order not found") — keep the string.
  }

  console.error(`[PayPal] ${context} failed${statusCode ? ` (status ${statusCode})` : ''}:`);
  console.error(details);
};

// POST /api/payments/create-paypal-order
const createPaypalOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const result = await paymentService.createPaypalOrder(orderId, req.user.id);
    return responseHandler.success(res, result, 'PayPal order created successfully', 201);
  } catch (error) {
    logPaypalError('createPaypalOrder', error);
    if (error.message.includes('Order not found')) {
      return responseHandler.error(res, error.message, 404);
    }
    if (error.message.includes('Unauthorized')) {
      return responseHandler.error(res, error.message, 403);
    }
    return responseHandler.error(res, error.message || 'Failed to create PayPal order', 500);
  }
};

// POST /api/payments/capture-paypal-order
const capturePaypalOrder = async (req, res) => {
  try {
    const { paypalOrderId, orderId } = req.body;
    const result = await paymentService.capturePaypalOrder(paypalOrderId, orderId, req.user.id);

    if (!result.success) {
      // Capture did not complete — leave the order pending and tell the client.
      return responseHandler.error(res, 'Payment was not completed', 402);
    }

    return responseHandler.success(
      res,
      { success: true, paymentStatus: result.order.paymentStatus, orderId: result.order._id },
      'Payment captured successfully',
      200
    );
  } catch (error) {
    logPaypalError('capturePaypalOrder', error);
    if (error.message.includes('Order not found')) {
      return responseHandler.error(res, error.message, 404);
    }
    if (error.message.includes('Unauthorized')) {
      return responseHandler.error(res, error.message, 403);
    }
    if (error.message.includes('does not match')) {
      return responseHandler.error(res, error.message, 409);
    }
    return responseHandler.error(res, error.message || 'Failed to capture PayPal payment', 500);
  }
};

module.exports = { createPaypalOrder, capturePaypalOrder };
