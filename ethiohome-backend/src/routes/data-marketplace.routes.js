const express = require('express');
const router = express.Router();
const dataMarketplaceController = require('../controllers/data-marketplace.controller');
const authMiddleware = require('../middlewares/auth.middleware');

/**
 * @file data-marketplace.routes.js
 * @description Routes for the Data Marketplace System
 */

// Public / Authenticated Routes
router.get('/datasets', authMiddleware, dataMarketplaceController.getDatasets);
router.get('/packages', authMiddleware, dataMarketplaceController.getTokenPackages);
router.get('/balance', authMiddleware, dataMarketplaceController.getTokenBalance);

// Purchase Routes
router.post('/purchase/initialize', authMiddleware, dataMarketplaceController.initializePurchase);
router.post('/purchase/verify', authMiddleware, dataMarketplaceController.verifyPurchase);

// Download Routes
router.get('/datasets/:id/download', authMiddleware, dataMarketplaceController.downloadDataset);

module.exports = router;
