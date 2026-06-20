const express = require('express');
const paymentController = require('../controllers/payment.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const {
  createPaypalOrderValidation,
  capturePaypalOrderValidation,
} = require('../validations/payment.validation');

const router = express.Router();

// Both endpoints require an authenticated user; ownership of the order is enforced in the service.
router.post(
  '/create-paypal-order',
  verifyToken,
  validate(createPaypalOrderValidation, 'body'),
  paymentController.createPaypalOrder
);

router.post(
  '/capture-paypal-order',
  verifyToken,
  validate(capturePaypalOrderValidation, 'body'),
  paymentController.capturePaypalOrder
);

module.exports = router;
