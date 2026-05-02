/**
 * @file owner.routes.js
 * @description Routes for Owner Module in EthioHome
 *
 * Base: /api/v1/owner
 */

const express    = require('express');
const router     = express.Router();
const ownerController  = require('../controllers/owner.controller');
const authenticate     = require('../middlewares/auth.middleware');
const authorize        = require('../middlewares/role.middleware');
const { handleMultipleUpload } = require('../middlewares/upload.middleware');

// ─── All owner routes require authentication and Owner role ───────────────────
router.use(authenticate);
router.use(authorize('Owner'));

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route   GET /api/owner/dashboard
 * @desc    Owner dashboard stats (property counts, commissions, recent activity)
 * @access  Private (Owner)
 */
router.get('/dashboard', ownerController.getDashboardStats);

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route   GET /api/owner/profile
 * @desc    Get complete profile
 */
router.get('/profile', ownerController.getProfile);

/**
 * @route   PATCH /api/owner/profile
 * @desc    Update basic profile info
 */
router.patch('/profile', ownerController.updateProfile);

/**
 * @route   PUT /api/owner/profile/change-password
 * @desc    Change owner password
 */
router.put('/profile/change-password', ownerController.changePassword);

/**
 * @route   POST /api/owner/profile/image
 * @desc    Upload profile image
 */
const { handleSingleUpload } = require('../middlewares/upload.middleware');
router.post('/profile/image', handleSingleUpload, ownerController.uploadProfileImage);

// ─────────────────────────────────────────────────────────────────────────────
// PROPERTIES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route   GET /api/owner/properties
 * @desc    Get all properties owned by the authenticated owner
 * @query   status, type, search, page, limit
 * @access  Private (Owner)
 */
router.get('/properties', ownerController.getProperties);

/**
 * @route   POST /api/owner/properties
 * @desc    Add a new property
 * @body    { title, description, type, price, location, bedrooms, bathrooms, area, amenities, status }
 * @access  Private (Owner)
 */
router.post('/properties', handleSingleUpload, ownerController.addProperty);

/**
 * @route   PATCH /api/owner/properties/:id/status
 * @desc    Update property availability status
 * @body    { status: 'Available' | 'Rented' | 'Sold' | 'Unavailable' }
 * @access  Private (Owner)
 */
router.patch('/properties/:id/status', ownerController.updatePropertyStatus);

/**
 * @route   POST /api/owner/properties/:id/assign-agent
 * @desc    Auto-assign a city-matching active agent to the property
 *          Owner CANNOT manually pick the agent — system assigns by city.
 * @access  Private (Owner)
 */
router.post('/properties/:id/assign-agent', ownerController.assignAgentToProperty);

/**
 * @route   GET /api/owner/properties/:id
 * @desc    Get detailed property info for editing
 * @access  Private (Owner)
 */
router.get('/properties/:id', ownerController.getPropertyDetails);

/**
 * @route   PUT /api/owner/properties/:id
 * @desc    Update property details
 * @access  Private (Owner)
 */
router.put('/properties/:id', ownerController.updateProperty);

// ─────────────────────────────────────────────────────────────────────────────
// PROPERTY IMAGES (Multiple Upload)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route   POST /api/owner/properties/:id/images
 * @desc    Upload multiple images for a property (max 8)
 * @body    multipart/form-data { images: File[] }
 * @access  Private (Owner)
 */
router.post(
  '/properties/:id/images',
  handleMultipleUpload,           // Multer + Cloudinary middleware
  ownerController.uploadPropertyImages
);

/**
 * @route   DELETE /api/owner/properties/:id/images/:imageId
 * @desc    Delete a specific property image from DB and Cloudinary
 * @access  Private (Owner)
 */
router.delete('/properties/:id/images/:imageId', ownerController.deletePropertyImage);

/**
 * @route   PATCH /api/owner/properties/:id/images/:imageId/set-primary
 * @desc    Set a specific image as the primary/cover photo
 * @access  Private (Owner)
 */
router.patch('/properties/:id/images/:imageId/set-primary', ownerController.setPrimaryImage);


// ─────────────────────────────────────────────────────────────────────────────
// OFFERS (BOOKINGS)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route   GET /api/owner/offers
 * @desc    Get all pending booking requests
 * @access  Private (Owner)
 */
router.get('/offers', ownerController.getOffers);

/**
 * @route   POST /api/owner/offers/:id/approve
 * @desc    Approve an offer (creates transaction & commission)
 * @access  Private (Owner)
 */
router.post('/offers/:id/approve', ownerController.approveOffer);

/**
 * @route   POST /api/owner/offers/:id/reject
 * @desc    Reject an offer
 * @access  Private (Owner)
 */
router.post('/offers/:id/reject', ownerController.rejectOffer);


// ─────────────────────────────────────────────────────────────────────────────
// COMMISSIONS & PAYMENTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route   GET /api/owner/commissions
 * @desc    Get commission history and pending payments
 */
router.get('/commissions', ownerController.getCommissions);

/**
 * @route   POST /api/owner/commissions/:id/pay
 * @desc    Pay commission for a transaction
 */
router.post('/commissions/:id/pay', ownerController.payCommission);

module.exports = router;
