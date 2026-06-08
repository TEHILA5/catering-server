const Joi = require('joi');

const registerValidation = Joi.object({
  fullName: Joi.string()
    .trim()
    .required()
    .messages({
      'string.empty': 'Full name is required',
      'any.required': 'Full name is required'
    }),
  email: Joi.string()
    .email()
    .trim()
    .lowercase()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.empty': 'Email is required',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .min(8)
    .required()
    .pattern(/[A-Z]/)
    .pattern(/[0-9]/)
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.empty': 'Password is required',
      'any.required': 'Password is required',
      'string.pattern.base': 'Password must contain at least 1 uppercase letter and 1 number'
    })
});

module.exports = {
  registerValidation
};
