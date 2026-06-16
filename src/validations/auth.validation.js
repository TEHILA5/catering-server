const Joi = require('joi');

const registerValidation = Joi.object({
  name: Joi.string().trim().required().messages({
    'string.empty': 'Name is required',
    'any.required': 'Name is required'
  }),
  email: Joi.string().email().trim().lowercase().required().messages({
    'string.email': 'Please provide a valid email address',
    'string.empty': 'Email is required',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(8).required().pattern(/[A-Z]/).pattern(/[0-9]/).messages({
    'string.min': 'Password must be at least 8 characters long',
    'string.empty': 'Password is required',
    'any.required': 'Password is required',
    'string.pattern.base': 'Password must contain at least 1 uppercase letter and 1 number'
  }),
  phone: Joi.string().trim().pattern(/^[0-9+\-\s()]{7,15}$/).required().messages({
    'string.empty': 'Phone number is required',
    'any.required': 'Phone number is required',
    'string.pattern.base': 'Please provide a valid phone number'
  })
});

const loginValidation = Joi.object({
  email: Joi.string().email().trim().lowercase().required().messages({
    'string.email': 'Email must be a valid email format',
    'any.required': 'Email is required'
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required',
    'string.empty': 'Password cannot be empty'
  })
});

module.exports = { registerValidation, loginValidation };
