const dishService = require('../services/dish.service');
const responseHandler = require('../utils/responseHandler');

// GET /api/dishes
const getAllDishes = async (req, res) => {
  try {
    const { category } = req.query;
    const dishes = await dishService.getAllDishes(category);
    responseHandler.success(res, dishes, 'Dishes retrieved successfully', 200);
  } catch (error) {
    responseHandler.error(res, error.message, 500);
  }
};

// GET /api/dishes/:id
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

// POST /api/dishes
const createDish = async (req, res) => {
  try {
    const dishData = req.body;
    const newDish = await dishService.createDish(dishData);
    responseHandler.success(res, newDish, 'Dish created successfully', 201);
  } catch (error) {
    responseHandler.error(res, error.message, 500);
  }
};

// PUT /api/dishes/:id
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

// DELETE /api/dishes/:id
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
