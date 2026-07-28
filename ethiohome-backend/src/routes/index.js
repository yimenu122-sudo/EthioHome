const express = require('express');
const router = express.Router();

// Import all routes
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const propertyRoutes = require('./property.routes');
const bookingRoutes = require('./booking.routes');
const paymentRoutes = require('./payment.routes');
const reviewRoutes = require('./review.routes');
const chatRoutes = require('./chat.routes');
const adminRoutes = require('./admin.routes');
const systemSettingsRoutes = require('./system_settings.routes');
const transactionRoutes = require('./transaction.routes');
const cityRoutes = require('./city.routes');
const agentRoutes = require('./agent.routes');
const ownerRoutes = require('./owner.routes');
const wishlistRoutes = require('./wishlist.routes');
const landManagerRoutes = require('./land-manager.routes');
const subCityRoutes = require('./sub-city.routes');
const landManagerMgmtRoutes = require('./land-manager-mgmt.routes');
const dataMarketplaceRoutes = require('./data-marketplace.routes');
const notificationRoutes = require('./notification.routes');

// Define API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/properties', propertyRoutes);
router.use('/bookings', bookingRoutes);
router.use('/payments', paymentRoutes);
router.use('/transactions', transactionRoutes);
router.use('/cities', cityRoutes);
router.use('/reviews', reviewRoutes);
router.use('/chats', chatRoutes);
router.use('/admin', adminRoutes);
router.use('/agent', agentRoutes);
router.use('/owner', ownerRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/land-manager', landManagerRoutes);
router.use('/land-managers', landManagerMgmtRoutes);
router.use('/sub-cities', subCityRoutes);
router.use('/system-settings', systemSettingsRoutes);
router.use('/data-marketplace', dataMarketplaceRoutes);
router.use('/notifications', notificationRoutes);

module.exports = router;
