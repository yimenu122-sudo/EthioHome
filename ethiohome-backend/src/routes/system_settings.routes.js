/**
 * @file system_settings.routes.js
 * @description Routes for accessing system configuration
 */

const express = require('express');
const router = express.Router();
const systemSettingsController = require('../controllers/system_settings.controller');

// Public route to get commission info (Needed for transparency in Buyer/Renter modules)
router.get('/commission', systemSettingsController.getCommissionSettings);

// Get settings by category
router.get('/category/:category', systemSettingsController.getSettingsByCategory);

module.exports = router;
