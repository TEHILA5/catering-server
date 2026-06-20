const Joi = require('joi');

const createOrderValidation = Joi.object({
  packageId: Joi.string()
    .required()
    .messages({
      'any.required': 'Package ID is required'
    }),
  selectedItems: Joi.array()
    .items(Joi.string())
    .optional(),
  numberOfGuests: Joi.number()
    .integer()
    .min(1)
    .required()
    .messages({
      'any.required': 'Number of guests is required',
      'number.min': 'Number of guests must be at least 1'
    }),
  eventDate: Joi.date()
    .required()
    .messages({
      'any.required': 'Event date is required',
      'date.base': 'Event date must be a valid date'
    }),
  address: Joi.string()
    .required()
    .messages({
      'any.required': 'Address is required'
    })
});

const updateOrderValidation = Joi.object({
  packageId: Joi.string()
    .optional(),
  selectedItems: Joi.array()
    .items(Joi.string())
    .optional(),
  eventDate: Joi.date()
    .optional()
    .messages({
      'date.base': 'Event date must be a valid date'
    }),
  address: Joi.string()
    .optional(),
  numberOfGuests: Joi.number()
    .integer()
    .min(1)
    .optional()
    .messages({
      'number.min': 'Number of guests must be at least 1'
    })
});

// Customers may not change paymentStatus — only confirm-payment / PayPal can.
const customerUpdateOrderValidation = Joi.object({
  packageId: Joi.string()
    .optional(),
  selectedItems: Joi.array()
    .items(Joi.string())
    .optional(),
  eventDate: Joi.date()
    .optional()
    .messages({
      'date.base': 'Event date must be a valid date'
    }),
  address: Joi.string()
    .optional(),
  numberOfGuests: Joi.number()
    .integer()
    .min(1)
    .optional()
    .messages({
      'number.min': 'Number of guests must be at least 1'
    })
});

const dateRangeValidation = Joi.object({
  startDate: Joi.date()
    .required()
    .messages({
      'any.required': 'Start date is required',
      'date.base': 'Start date must be a valid date'
    }),
  endDate: Joi.date()
    .required()
    .messages({
      'any.required': 'End date is required',
      'date.base': 'End date must be a valid date'
    })
});

module.exports = { createOrderValidation, updateOrderValidation, customerUpdateOrderValidation, dateRangeValidation };
