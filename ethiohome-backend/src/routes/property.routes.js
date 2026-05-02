/**
 * @file property.routes.js
 * @description Core business module for property management
 * @author Senior Node.js Developer
 */

const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/property.controller');
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');
const { ROLES } = require('../config/roles');

// Public Routes
router.get('/', propertyController.getAllProperties);
router.get('/search', propertyController.searchProperties);
router.get('/:id', propertyController.getPropertyById);

// Protected Routes
router.use(auth);

// Create Property - Owners and Agents only
router.post('/', 
  role([ROLES.OWNER, ROLES.AGENT]), 
  propertyController.createProperty
);

// Update Property - Owners and Agents only
router.put('/:id', 
  role([ROLES.OWNER, ROLES.AGENT]), 
  propertyController.updateProperty
);

// Delete Property - Owners only
router.delete('/:id', 
  role([ROLES.OWNER]), 
  propertyController.deleteProperty
);

// Update Status - Owners and Agents
router.put('/:id/status', 
  role([ROLES.OWNER, ROLES.AGENT]), 
  propertyController.updateStatus
);

// Upload Images
router.post('/:id/images', 
  role([ROLES.OWNER, ROLES.AGENT]), 
  propertyController.uploadImages
);

// Assign Agent - Admin only based on logic (or owner if they hire)
router.put('/:id/assign-agent', 
  role([ROLES.ADMIN, ROLES.OWNER]), 
  propertyController.assignAgent
);

module.exports = router;
