const Joi = require('joi');

const loginValidation = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Email must be a valid email format',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .required()
    .min(1)
    .messages({
      'any.required': 'Password is required',
      'string.empty': 'Password cannot be empty'
    })
});

module.exports = { loginValidation };
