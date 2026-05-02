/**
 * @file agent.routes.js
 * @description Routes for the Agent Module
 */

const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agent.controller');
const authenticate = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');

// All agent routes require authentication and Agent/Admin role
router.use(authenticate);
router.use(authorize('Agent', 'Admin'));

/**
 * @route GET /api/v1/agent/dashboard
 * @desc Get agent performance stats
 */
router.get('/dashboard', agentController.getDashboardStats);

/**
 * @route GET /api/v1/agent/properties
 * @desc Get all properties assigned to the agent
 */
router.get('/properties', agentController.getManagedProperties);

/**
 * @route GET /api/v1/agent/properties/:id
 * @desc Get detailed info for a specific property
 */
router.get('/properties/:id', agentController.getAgentPropertyDetails);

/**
 * @route PATCH /api/v1/agent/properties/:property_id/status
 * @desc Update property availability status
 */
router.patch('/properties/:property_id/status', agentController.updatePropertyStatus);

/**
 * @route GET /api/v1/agent/owners/search
 * @desc Search for owners to assign to a property
 */
router.get('/owners/search', agentController.searchOwners);

/**
 * @route POST /api/v1/agent/properties/assign-owner
 * @desc Assign or re-assign a property to an owner
 */
router.post('/properties/assign-owner', agentController.assignOwner);

/**
 * @route POST /api/v1/agent/properties
 * @desc Add a new property listing
 */
const { handleSingleUpload } = require('../middlewares/upload.middleware');
router.post('/properties', handleSingleUpload, agentController.addProperty);

/**
 * @route PUT /api/v1/agent/properties/:id
 * @desc Update an existing property listing
 */
router.put('/properties/:id', agentController.updateProperty);

/**
 * @route GET /api/v1/agent/bookings
 * @desc Get agent's appointments with city restriction
 */
router.get('/bookings', agentController.getBookings);

/**
 * @route PATCH /api/v1/agent/bookings/:id
 * @desc Approve or Cancel property viewings
 */
router.patch('/bookings/:id', agentController.updateBookingStatus);

/**
 * @route GET /api/v1/agent/commissions
 * @desc Get agent earnings and payouts
 */
router.get('/commissions', agentController.getCommissions);

/**
 * @route GET /api/v1/agent/clients
 * @desc Get unique clients who have booked with the agent
 */
router.get('/clients', agentController.getClients);

module.exports = router;
