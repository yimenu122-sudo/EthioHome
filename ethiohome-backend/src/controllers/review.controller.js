/**
 * @file review.controller.js
 * @description Trust & feedback management for EthioHome
 */

const { Review, Property, PropertyImage } = require('../models/associations');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * Add a new review
 */
exports.addReview = async (req, res) => {
  try {
    const { target_id, rating, comment } = req.body;

    // Logic to verify if reviewer has completed a transaction/booking with this target
    
    const review = await Review.create({
      reviewer_id: req.user.id,
      target_id,
      rating,
      comment
    });

    return successResponse(res, review, 'Review added successfully', 201);
  } catch (error) {
    return errorResponse(res, 'Failed to add review', 500);
  }
};

/**
 * Get reviews for a specific property
 */
exports.getPropertyReviews = async (req, res) => {
  try {
    const reviews = await Review.findAll({
      where: { target_id: req.params.propertyId },
      order: [['created_at', 'DESC']]
    });
    return successResponse(res, reviews, 'Property reviews fetched');
  } catch (error) {
    return errorResponse(res, 'Failed to fetch reviews', 500);
  }
};

/**
 * Get reviews for an agent/broker
 */
exports.getAgentReviews = async (req, res) => {
  try {
    const reviews = await Review.findAll({
      where: { target_id: req.params.agentId },
      order: [['created_at', 'DESC']]
    });
    return successResponse(res, reviews, 'Agent reviews fetched');
  } catch (error) {
    return errorResponse(res, 'Failed to fetch reviews', 500);
  }
};

/**
 * Update review
 */
exports.updateReview = async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id);
    if (!review) return errorResponse(res, 'Review not found', 404);
    if (review.reviewer_id !== req.user.id) return errorResponse(res, 'Unauthorised', 403);

    await review.update(req.body);
    return successResponse(res, review, 'Review updated');
  } catch (error) {
    return errorResponse(res, 'Update failed', 500);
  }
};

/**
 * Delete review
 */
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id);
    if (!review) return errorResponse(res, 'Review not found', 404);
    
    if (review.reviewer_id !== req.user.id && req.user.role !== 'Admin') {
      return errorResponse(res, 'Unauthorised', 403);
    }

    await review.destroy();
    return successResponse(res, null, 'Review deleted');
  } catch (error) {
    return errorResponse(res, 'Deletion failed', 500);
  }
};
/**
 * Get reviews written by the current user
 */
exports.getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.findAll({
      where: { reviewer_id: req.user.id },
      include: [
        {
          model: Property,
          as: 'property',
          attributes: ['title', 'price', 'city'],
          include: [{ model: PropertyImage, as: 'images', limit: 1 }]
        }
      ],
      order: [['created_at', 'DESC']]
    });

    return successResponse(res, reviews, 'Your reviews fetched successfully');
  } catch (error) {
    console.error('Get My Reviews Error:', error);
    return errorResponse(res, 'Failed to fetch your reviews', 500);
  }
};
