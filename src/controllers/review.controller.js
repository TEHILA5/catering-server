const reviewService = require('../services/review.service');
const responseHandler = require('../utils/responseHandler');

// GET /api/reviews?packageId=  (public)
const getAllReviews = async (req, res) => {
  try {
    const { packageId } = req.query;
    const reviews = await reviewService.getAllReviews(packageId);
    return responseHandler.success(res, reviews, 'Reviews retrieved successfully', 200);
  } catch (error) {
    return responseHandler.error(res, error.message || 'Failed to retrieve reviews', 500);
  }
};

// GET /api/reviews/stats?packageId=  (public)
const getStats = async (req, res) => {
  try {
    const { packageId } = req.query;
    const stats = await reviewService.getStats(packageId);
    return responseHandler.success(res, stats, 'Review stats retrieved successfully', 200);
  } catch (error) {
    return responseHandler.error(res, error.message || 'Failed to retrieve review stats', 500);
  }
};

// GET /api/reviews/user  (auth)
const getMyReviews = async (req, res) => {
  try {
    const reviews = await reviewService.getByUserId(req.user.id);
    return responseHandler.success(res, reviews, 'User reviews retrieved successfully', 200);
  } catch (error) {
    return responseHandler.error(res, error.message || 'Failed to retrieve user reviews', 500);
  }
};

// POST /api/reviews  (auth)
const createReview = async (req, res) => {
  try {
    const { orderId, packageId, rating, comment } = req.body;
    const review = await reviewService.createReview({
      userId: req.user.id,
      orderId,
      packageId,
      rating,
      comment
    });
    return responseHandler.success(res, review, 'Review created successfully', 201);
  } catch (error) {
    if (error.message.includes('not found')) {
      return responseHandler.error(res, error.message, 404);
    }
    if (error.message.includes('Unauthorized')) {
      return responseHandler.error(res, error.message, 403);
    }
    if (error.message.includes('already exists')) {
      return responseHandler.error(res, error.message, 409);
    }
    return responseHandler.error(res, error.message || 'Failed to create review', 500);
  }
};

// PUT /api/reviews/:reviewId  (auth — owner or admin)
const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const isAdmin = req.user.role === 'admin';
    const review = await reviewService.updateReview(reviewId, req.user.id, isAdmin, req.body);
    return responseHandler.success(res, review, 'Review updated successfully', 200);
  } catch (error) {
    if (error.message.includes('not found')) {
      return responseHandler.error(res, error.message, 404);
    }
    if (error.message.includes('Unauthorized')) {
      return responseHandler.error(res, error.message, 403);
    }
    return responseHandler.error(res, error.message || 'Failed to update review', 500);
  }
};

// DELETE /api/reviews/:reviewId  (auth — owner or admin)
const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const isAdmin = req.user.role === 'admin';
    const review = await reviewService.deleteReview(reviewId, req.user.id, isAdmin);
    return responseHandler.success(res, review, 'Review deleted successfully', 200);
  } catch (error) {
    if (error.message.includes('not found')) {
      return responseHandler.error(res, error.message, 404);
    }
    if (error.message.includes('Unauthorized')) {
      return responseHandler.error(res, error.message, 403);
    }
    return responseHandler.error(res, error.message || 'Failed to delete review', 500);
  }
};

module.exports = {
  getAllReviews,
  getStats,
  getMyReviews,
  createReview,
  updateReview,
  deleteReview
};