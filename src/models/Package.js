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
  pricePerPerson: {
    type: Number,
    required: true,
    min: 0
  },
  limits: {
    starters: {
      type: Number,
      default: 2
    },
    mainCourses: {
      type: Number,
      default: 2
    },
    salads: {
      type: Number,
      default: 10
    },
    desserts: {
      type: Number,
      default: 4
    },
    breads: {
      type: Number,
      default: 2
    },
    drinks: {
      type: Number,
      default: 2
    }
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
