const Dish = require('../models/Dish');

/**
 * Get all dishes with optional category filter
 * Returns only active dishes by default
 * @param {string} category - Optional category filter
 * @returns {Promise<Array>} Array of active dishes
 * @throws {Error} Descriptive error message
 */
const getAllDishes = async (category) => {
  try {
    const filter = {};
    
    if (category) {
      filter.category = category;
    }
    
    const dishes = await Dish.find(filter).lean();
    return dishes;
  } catch (error) {
    throw new Error(`Failed to retrieve dishes: ${error.message}`);
  }
};

/**
 * Get a single dish by ID
 * @param {string} id - Dish ID
 * @returns {Promise<Object>} Dish object
 * @throws {Error} If dish not found
 */
const getDishById = async (id) => {
  try {
    const dish = await Dish.findById(id).lean();
    
    if (!dish) {
      throw new Error('Dish not found');
    }
    
    return dish;
  } catch (error) {
    if (error.message === 'Dish not found') {
      throw error;
    }
    throw new Error(`Failed to retrieve dish: ${error.message}`);
  }
};

/**
 * Create a new dish
 * @param {Object} dishData - Dish data
 * @returns {Promise<Object>} Created dish object
 * @throws {Error} If validation or creation fails
 */
const createDish = async (dishData) => {
  try {
    const dish = new Dish(dishData);
    await dish.save();
    return dish.toObject();
  } catch (error) {
    throw new Error(`Failed to create dish: ${error.message}`);
  }
};

/**
 * Update a dish by ID
 * @param {string} id - Dish ID
 * @param {Object} dishData - Updated dish data
 * @returns {Promise<Object>} Updated dish object
 * @throws {Error} If dish not found or update fails
 */
const updateDish = async (id, dishData) => {
  try {
    const dish = await Dish.findByIdAndUpdate(
      id,
      dishData,
      { returnDocument: 'after', runValidators: true }
    );
    
    if (!dish) {
      throw new Error('Dish not found');
    }
    
    return dish.toObject();
  } catch (error) {
    if (error.message === 'Dish not found') {
      throw error;
    }
    throw new Error(`Failed to update dish: ${error.message}`);
  }
};

/**
 * Delete a dish by ID
 * @param {string} id - Dish ID
 * @returns {Promise<Object>} Deleted dish object
 * @throws {Error} If dish not found or deletion fails
 */
const deleteDish = async (id) => {
  try {
    const dish = await Dish.findByIdAndDelete(id);
    
    if (!dish) {
      throw new Error('Dish not found');
    }
    
    return dish.toObject();
  } catch (error) {
    if (error.message === 'Dish not found') {
      throw error;
    }
    throw new Error(`Failed to delete dish: ${error.message}`);
  }
};

module.exports = {
  getAllDishes,
  getDishById,
  createDish,
  updateDish,
  deleteDish
};
