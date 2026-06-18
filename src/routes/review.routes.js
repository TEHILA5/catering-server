const express = require('express');
const reviewController = require('../controllers/review.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { createReviewValidation, updateReviewValidation } = require('../validations/review.validation');

const router = express.Router();

// Public: anyone can read reviews and aggregate stats (used before ordering).
router.get('/', reviewController.getAllReviews);
router.get('/stats', reviewController.getStats);

// Authenticated: a user's own reviews. Registered before /:reviewId to avoid conflicts.
router.get('/user', verifyToken, reviewController.getMyReviews);

router.post('/', verifyToken, validate(createReviewValidation, 'body'), reviewController.createReview);
router.put('/:reviewId', verifyToken, validate(updateReviewValidation, 'body'), reviewController.updateReview);
router.delete('/:reviewId', verifyToken, reviewController.deleteReview);

module.exports = router;
