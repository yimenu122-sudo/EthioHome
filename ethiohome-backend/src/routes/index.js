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
router.use('/system-settings', systemSettingsRoutes);

module.exports = router;
