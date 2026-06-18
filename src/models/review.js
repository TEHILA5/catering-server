const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
  packageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Package', default: null },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true, trim: true, maxlength: 1000 },
  createdAt: { type: Date, default: Date.now }
});

reviewSchema.index({ orderId: 1 }, { unique: true, sparse: true });

const Review = mongoose.model('Review', reviewSchema, 'reviews');
module.exports = Review;