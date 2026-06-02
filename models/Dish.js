const mongoose = require('mongoose');

const dishSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['Starters', 'MainCourses', 'Salads', 'Desserts', 'Breads', 'Drinks'],
    required: true
  },
  imageUrl: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Dish = mongoose.model('Dish', dishSchema, 'products');

module.exports = Dish;
