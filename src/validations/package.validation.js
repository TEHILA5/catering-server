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
  imageUrl: Joi.string().uri().allow('').messages({
    'string.uri': 'Image URL must be a valid URL'
  }),
  pricePerPerson: Joi.number().required().positive().messages({
    'number.base': 'Price per person must be a number',
    'number.positive': 'Price per person must be greater than 0'
  }),
  limits: Joi.object({
    starters: Joi.number().integer().min(0).max(5).messages({
      'number.min': 'Starters limit cannot be negative',
      'number.max': 'Starters limit cannot exceed 5'
    }),
    mainCourses: Joi.number().integer().min(0).max(4).messages({
      'number.min': 'Main courses limit cannot be negative',
      'number.max': 'Main courses limit cannot exceed 4'
    }),
    salads: Joi.number().integer().min(0).max(6).messages({
      'number.min': 'Salads limit cannot be negative',
      'number.max': 'Salads limit cannot exceed 6'
    }),
    desserts: Joi.number().integer().min(0).max(4).messages({
      'number.min': 'Desserts limit cannot be negative',
      'number.max': 'Desserts limit cannot exceed 4'
    }),
    breads: Joi.number().integer().min(0).max(3).messages({
      'number.min': 'Breads limit cannot be negative',
      'number.max': 'Breads limit cannot exceed 3'
    }),
    drinks: Joi.number().integer().min(0).max(6).messages({
      'number.min': 'Drinks limit cannot be negative',
      'number.max': 'Drinks limit cannot exceed 6'
    })
  }).unknown(true),
  featured: Joi.boolean().messages({
    'boolean.base': 'Featured must be a boolean value'
  })
});

const updatePackageSchema = packageSchema.fork(['packageName', 'pricePerPerson'], schema => schema.optional());

module.exports = {
  packageSchema,
  updatePackageSchema
};
