const mongoose = require('mongoose');
const Review = require('../models/Review');
const Order = require('../models/Order');

// All reviews, newest first. Optionally filtered by package.
const getAllReviews = async (packageId) => {
  const filter = {};
  if (packageId) filter.packageId = packageId;

  const reviews = await Review.find(filter)
    .populate('userId', 'name')
    .populate('packageId', 'packageName')
    .sort({ createdAt: -1 });

  return reviews;
};

// Reviews written by a specific user, newest first.
const getByUserId = async (userId) => {
  const reviews = await Review.find({ userId })
    .populate('userId', 'name')
    .populate('packageId', 'packageName')
    .sort({ createdAt: -1 });

  return reviews;
};

// Aggregate average rating and total count. Optionally scoped to one package.
const getStats = async (packageId) => {
  const match = {};
  if (packageId) match.packageId = new mongoose.Types.ObjectId(packageId);

  const result = await Review.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        count: { $sum: 1 }
      }
    }
  ]);

  if (!result.length) return { averageRating: 0, count: 0 };
  return {
    averageRating: Math.round(result[0].averageRating * 10) / 10,
    count: result[0].count
  };
};

const createReview = async (data) => {
  const { userId, orderId, rating, comment } = data;

  // A review is always tied to one of the user's own orders. Ownership is enforced,
  // the package is derived from the order (never trusted from the client), and a
  // single review per order is allowed.
  const order = await Order.findById(orderId);
  if (!order) throw new Error('Order not found');
  if (order.userId.toString() !== userId.toString()) {
    throw new Error('Unauthorized: you can only review your own orders');
  }

  const existing = await Review.findOne({ orderId });
  if (existing) throw new Error('A review already exists for this order');

  const review = await Review.create({
    userId,
    orderId,
    packageId: order.packageId,
    rating,
    comment
  });

  return review.populate([
    { path: 'userId', select: 'name' },
    { path: 'packageId', select: 'packageName' }
  ]);
};

const updateReview = async (reviewId, userId, isAdmin, data) => {
  const existing = await Review.findById(reviewId);
  if (!existing) throw new Error('Review not found');
  if (!isAdmin && existing.userId.toString() !== userId.toString()) {
    throw new Error('Unauthorized: you can only edit your own reviews');
  }

  const review = await Review.findByIdAndUpdate(reviewId, data, { new: true })
    .populate('userId', 'name')
    .populate('packageId', 'packageName');

  if (!review) throw new Error('Review not found');
  return review;
};

const deleteReview = async (reviewId, userId, isAdmin) => {
  const existing = await Review.findById(reviewId);
  if (!existing) throw new Error('Review not found');
  if (!isAdmin && existing.userId.toString() !== userId.toString()) {
    throw new Error('Unauthorized: you can only delete your own reviews');
  }

  await Review.findByIdAndDelete(reviewId);
  return existing;
};

module.exports = {
  getAllReviews,
  getByUserId,
  getStats,
  createReview,
  updateReview,
  deleteReview
};
