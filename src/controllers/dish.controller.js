const dishService = require('../services/dish.service');
const responseHandler = require('../utils/responseHandler');

/**
 * @swagger
 * /api/dishes:
 *   get:
 *     summary: Get all dishes
 *     description: Retrieve all active dishes. Optional category filter available.
 *     tags:
 *       - Dishes
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [Starters, MainCourses, Salads, Desserts, Breads, Drinks]
 *         description: Filter dishes by category
 *     responses:
 *       200:
 *         description: List of active dishes
 *       400:
 *         description: Invalid query parameters
 *       500:
 *         description: Server error
 */
const getAllDishes = async (req, res) => {
  try {
    const { category } = req.query;
    const dishes = await dishService.getAllDishes(category);
    responseHandler.success(res, dishes, 'Dishes retrieved successfully', 200);
  } catch (error) {
    responseHandler.error(res, error.message, 500);
  }
};

/**
 * @swagger
 * /api/dishes/{id}:
 *   get:
 *     summary: Get a single dish
 *     description: Retrieve a dish by ID
 *     tags:
 *       - Dishes
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Dish ID (24-character hex string)
 *     responses:
 *       200:
 *         description: Dish retrieved successfully
 *       400:
 *         description: Invalid dish ID format
 *       404:
 *         description: Dish not found
 *       500:
 *         description: Server error
 */
const getDishById = async (req, res) => {
  try {
    const { id } = req.params;
    const dish = await dishService.getDishById(id);
    responseHandler.success(res, dish, 'Dish retrieved successfully', 200);
  } catch (error) {
    const statusCode = error.message === 'Dish not found' ? 404 : 500;
    responseHandler.error(res, error.message, statusCode);
  }
};

/**
 * @swagger
 * /api/dishes:
 *   post:
 *     summary: Create a new dish
 *     description: Create a new dish (admin only)
 *     tags:
 *       - Dishes
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - category
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 maxLength: 500
 *               category:
 *                 type: string
 *                 enum: [Starters, MainCourses, Salads, Desserts, Breads, Drinks]
 *               imageUrl:
 *                 type: string
 *                 format: uri
 *     responses:
 *       201:
 *         description: Dish created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 *       500:
 *         description: Server error
 */
const createDish = async (req, res) => {
  try {
    const dishData = req.body;
    const newDish = await dishService.createDish(dishData);
    responseHandler.success(res, newDish, 'Dish created successfully', 201);
  } catch (error) {
    responseHandler.error(res, error.message, 500);
  }
};

/**
 * @swagger
 * /api/dishes/{id}:
 *   put:
 *     summary: Update a dish
 *     description: Update a dish by ID (admin only)
 *     tags:
 *       - Dishes
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Dish ID (24-character hex string)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 maxLength: 500
 *               category:
 *                 type: string
 *                 enum: [Starters, MainCourses, Salads, Desserts, Breads, Drinks]
 *               imageUrl:
 *                 type: string
 *                 format: uri
 *     responses:
 *       200:
 *         description: Dish updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 *       404:
 *         description: Dish not found
 *       500:
 *         description: Server error
 */
const updateDish = async (req, res) => {
  try {
    const { id } = req.params;
    const dishData = req.body;
    const updatedDish = await dishService.updateDish(id, dishData);
    responseHandler.success(res, updatedDish, 'Dish updated successfully', 200);
  } catch (error) {
    const statusCode = error.message === 'Dish not found' ? 404 : 500;
    responseHandler.error(res, error.message, statusCode);
  }
};

/**
 * @swagger
 * /api/dishes/{id}:
 *   delete:
 *     summary: Delete a dish
 *     description: Delete a dish by ID (admin only)
 *     tags:
 *       - Dishes
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Dish ID (24-character hex string)
 *     responses:
 *       200:
 *         description: Dish deleted successfully
 *       400:
 *         description: Invalid dish ID format
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 *       404:
 *         description: Dish not found
 *       500:
 *         description: Server error
 */
const deleteDish = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedDish = await dishService.deleteDish(id);
    responseHandler.success(res, deletedDish, 'Dish deleted successfully', 200);
  } catch (error) {
    const statusCode = error.message === 'Dish not found' ? 404 : 500;
    responseHandler.error(res, error.message, statusCode);
  }
};

module.exports = {
  getAllDishes,
  getDishById,
  createDish,
  updateDish,
  deleteDish
};
