/**
 * @file review.routes.js
 * @description Trust & transparency layer for property and agent ratings
 * @author Senior Node.js Developer
 */

const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');
const { ROLES } = require('../config/roles');

// Publicly viewable reviews
router.get('/property/:propertyId', reviewController.getPropertyReviews);
router.get('/agent/:agentId', reviewController.getAgentReviews);

// Protected Routes
router.use(auth);

// Add Review - Renters/Buyers only
router.post('/', 
  role([ROLES.RENTER, ROLES.BUYER]), 
  reviewController.addReview
);

// Get my reviews
router.get('/me', reviewController.getMyReviews);

// Edit Review - Owner of the review
router.put('/:id', reviewController.updateReview);

// Delete Review - Owner or Admin
router.delete('/:id', reviewController.deleteReview);

module.exports = router;
