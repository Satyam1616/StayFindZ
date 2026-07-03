/**
 * Reviews Routes
 * /api/v1/reviews/*
 */

const express = require('express');
const router = express.Router();

const { createReview, getListingReviews } = require('../controllers/reviewsController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { sanitizeInput } = require('../middleware/sanitize');
const { createReviewSchema, uuidParamSchema } = require('../utils/schemas');

// Public — get reviews for a listing
router.get('/listing/:id', validate(uuidParamSchema), getListingReviews);

// Protected — create a review (sanitize comment text)
router.post('/', authenticate, sanitizeInput, validate(createReviewSchema), createReview);

module.exports = router;
