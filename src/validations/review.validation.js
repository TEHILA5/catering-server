const Joi = require('joi');

const createReviewValidation = Joi.object({
  // A review must be tied to one of the customer's own orders.
  orderId: Joi.string()
    .required()
    .messages({
      'any.required': 'Order ID is required — reviews can only be written for an order you placed',
      'string.empty': 'Order ID is required — reviews can only be written for an order you placed'
    }),
  packageId: Joi.string()
    .optional()
    .allow(null, ''),
  rating: Joi.number()
    .integer()
    .min(1)
    .max(5)
    .required()
    .messages({
      'any.required': 'Rating is required',
      'number.min': 'Rating must be at least 1',
      'number.max': 'Rating must be at most 5'
    }),
  comment: Joi.string()
    .trim()
    .min(1)
    .max(1000)
    .required()
    .messages({
      'any.required': 'Comment is required',
      'string.empty': 'Comment is required',
      'string.max': 'Comment must be at most 1000 characters'
    })
});

const updateReviewValidation = Joi.object({
  rating: Joi.number()
    .integer()
    .min(1)
    .max(5)
    .optional()
    .messages({
      'number.min': 'Rating must be at least 1',
      'number.max': 'Rating must be at most 5'
    }),
  comment: Joi.string()
    .trim()
    .min(1)
    .max(1000)
    .optional()
    .messages({
      'string.empty': 'Comment cannot be empty',
      'string.max': 'Comment must be at most 1000 characters'
    })
}).min(1);

module.exports = { createReviewValidation, updateReviewValidation };