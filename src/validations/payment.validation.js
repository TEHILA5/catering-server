const Joi = require('joi');

const createPaypalOrderValidation = Joi.object({
  orderId: Joi.string()
    .required()
    .messages({
      'any.required': 'Order ID is required'
    })
});

const capturePaypalOrderValidation = Joi.object({
  paypalOrderId: Joi.string()
    .required()
    .messages({
      'any.required': 'PayPal order ID is required'
    }),
  orderId: Joi.string()
    .required()
    .messages({
      'any.required': 'Order ID is required'
    })
});

module.exports = { createPaypalOrderValidation, capturePaypalOrderValidation };
