const Joi = require('joi');

const createOrderValidation = Joi.object({
  userId: Joi.string()
    .required()
    .messages({
      'any.required': 'User ID is required'
    }),
  packageId: Joi.string()
    .required()
    .messages({
      'any.required': 'Package ID is required'
    }),
  selectedItems: Joi.array()
    .items(Joi.string())
    .optional(),
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
    }),
  totalPrice: Joi.number()
    .min(0)
    .required()
    .messages({
      'any.required': 'Total price is required',
      'number.min': 'Total price must be at least 0'
    })
});

module.exports = { createOrderValidation };
