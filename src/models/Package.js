const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
  packageName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  imageUrl: {
    type: String,
    trim: true
  },
  pricePerPerson: {
    type: Number,
    required: true,
    min: 0
  },
  limits: {
    starters: {
      type: Number,
      default: 2,
      min: 0,
      max: 10
    },
    mainCourses: {
      type: Number,
      default: 2,
      min: 0,
      max: 8
    },
    salads: {
      type: Number,
      default: 3,
      min: 0,
      max: 15
    },
    desserts: {
      type: Number,
      default: 2,
      min: 0,
      max: 8
    },
    breads: {
      type: Number,
      default: 1,
      min: 0,
      max: 6
    },
    drinks: {
      type: Number,
      default: 3,
      min: 0,
      max: 10
    }
  },
  imageUrl: {
    type: String,
    trim: true
  },
  featured: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Package', packageSchema);
