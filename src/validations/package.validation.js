const Joi = require('joi');

const packageSchema = Joi.object({
  packageName: Joi.string().required().min(2).max(100).messages({
    'string.empty': 'Package name is required',
    'string.min': 'Package name must be at least 2 characters',
    'string.max': 'Package name must not exceed 100 characters'
  }),
  description: Joi.string().max(500).allow('').messages({
    'string.max': 'Description must not exceed 500 characters'
  }),
  pricePerPerson: Joi.number().required().positive().messages({
    'number.base': 'Price per person must be a number',
    'number.positive': 'Price per person must be greater than 0'
  }),
  limits: Joi.object({
    starters: Joi.number().integer().min(0).messages({
      'number.min': 'Starters limit cannot be negative'
    }),
    mainCourses: Joi.number().integer().min(0).messages({
      'number.min': 'Main courses limit cannot be negative'
    }),
    salads: Joi.number().integer().min(0).messages({
      'number.min': 'Salads limit cannot be negative'
    }),
    desserts: Joi.number().integer().min(0).messages({
      'number.min': 'Desserts limit cannot be negative'
    }),
    breads: Joi.number().integer().min(0).messages({
      'number.min': 'Breads limit cannot be negative'
    }),
    drinks: Joi.number().integer().min(0).messages({
      'number.min': 'Drinks limit cannot be negative'
    })
  }).unknown(true),
  featured: Joi.boolean().messages({
    'boolean.base': 'Featured must be a boolean value'
  })
});

const validatePackage = (data) => {
  return packageSchema.validate(data, { abortEarly: false });
};

const validatePackageUpdate = (data) => {
  const updateSchema = packageSchema.fork(['packageName', 'pricePerPerson'], schema => schema.optional());
  return updateSchema.validate(data, { abortEarly: false });
};

module.exports = {
  validatePackage,
  validatePackageUpdate
};
