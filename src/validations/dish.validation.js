const Joi = require('joi');

const createDishSchema = Joi.object({
  name: Joi.string()
    .trim()
    .required()
    .min(2)
    .max(100)
    .messages({
      'string.empty': 'Dish name is required',
      'string.min': 'Dish name must be at least 2 characters',
      'string.max': 'Dish name cannot exceed 100 characters'
    }),
  description: Joi.string()
    .trim()
    .max(500)
    .messages({
      'string.max': 'Description cannot exceed 500 characters'
    }),
  category: Joi.string()
    .required()
    .valid('starters', 'mainCourses', 'salads', 'desserts', 'breads', 'drinks')
    .messages({
      'any.only': 'Category must be one of: starters, mainCourses, salads, desserts, breads, drinks',
      'string.empty': 'Category is required'
    }),
  imageUrl: Joi.string()
    .trim()
    .uri()
    .messages({
      'string.uri': 'Image URL must be a valid URI'
    }),
});

const updateDishSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .messages({
      'string.min': 'Dish name must be at least 2 characters',
      'string.max': 'Dish name cannot exceed 100 characters'
    }),
  description: Joi.string()
    .trim()
    .max(500)
    .messages({
      'string.max': 'Description cannot exceed 500 characters'
    }),
  category: Joi.string()
    .valid('starters', 'mainCourses', 'salads', 'desserts', 'breads', 'drinks')
    .messages({
      'any.only': 'Category must be one of: starters, mainCourses, salads, desserts, breads, drinks'
    }),
  imageUrl: Joi.string()
    .trim()
    .uri()
    .messages({
      'string.uri': 'Image URL must be a valid URI'
    })
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

const getDishParamSchema = Joi.object({
  id: Joi.string()
    .required()
    .length(24)
    .hex()
    .messages({
      'string.length': 'Invalid dish ID format',
      'string.hex': 'Invalid dish ID format'
    })
});

const categoryQuerySchema = Joi.object({
  category: Joi.string()
    .valid('starters', 'mainCourses', 'salads', 'desserts', 'breads', 'drinks')
    .messages({
      'any.only': 'Invalid category filter'
    })
}).unknown(true);

module.exports = {
  createDishSchema,
  updateDishSchema,
  getDishParamSchema,
  categoryQuerySchema
};
