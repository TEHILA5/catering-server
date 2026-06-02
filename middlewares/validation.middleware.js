const responseHandler = require('../utils/responseHandler');

/**
 * Validation middleware factory - validates request based on Joi schema
 * @param {Joi.Schema} schema - The Joi schema to validate against
 * @param {string} source - Where to validate: 'body', 'params', 'query'
 * @returns {Function} Express middleware
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const dataToValidate = req[source];
      const { error, value } = schema.validate(dataToValidate, {
        abortEarly: false,
        stripUnknown: true
      });

      if (error) {
        const messages = error.details.map(detail => detail.message);
        return responseHandler.error(res, messages.join(', '), 400);
      }

      req[source] = value;
      next();
    } catch (err) {
      responseHandler.error(res, 'Validation error occurred', 500);
    }
  };
};

module.exports = { validate };
