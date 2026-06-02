const express = require('express');
const router = express.Router();
const dishController = require('../controllers/dish.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { isAdmin } = require('../middlewares/admin.middleware');
const { validate } = require('../middlewares/validation.middleware');
const {
  createDishSchema,
  updateDishSchema,
  getDishParamSchema,
  categoryQuerySchema
} = require('../validations/dish.validation');

/**
 * GET all dishes
 * Public endpoint - returns only active dishes with optional category filter
 */
router.get('/', validate(categoryQuerySchema, 'query'), dishController.getAllDishes);

/**
 * GET a single dish by ID
 * Public endpoint
 */
router.get('/:id', validate(getDishParamSchema, 'params'), dishController.getDishById);

/**
 * POST create a new dish
 * Protected endpoint - admin only
 */
router.post('/', verifyToken, isAdmin, validate(createDishSchema, 'body'), dishController.createDish);

/**
 * PUT update a dish
 * Protected endpoint - admin only
 */
router.put('/:id', verifyToken, isAdmin, validate(getDishParamSchema, 'params'), validate(updateDishSchema, 'body'), dishController.updateDish);

/**
 * DELETE a dish
 * Protected endpoint - admin only
 */
router.delete('/:id', verifyToken, isAdmin, validate(getDishParamSchema, 'params'), dishController.deleteDish);

module.exports = router;
