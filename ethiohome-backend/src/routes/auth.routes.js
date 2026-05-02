/**
 * @file auth.routes.js
 * @description Authentication routes for EthioHome
 * @author Senior Node.js Developer
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const auth = require('../middlewares/auth.middleware');

// Public Routes
router.post('/register', authController.register);
router.post('/guest-register', authController.registerGuest);
router.post('/guest-login', authController.loginGuest);
router.post('/google-login', authController.googleLogin);
router.post('/login/init', authController.loginInit);
router.post('/login/verify', authController.verifyLoginOTP);
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/verify-account', authController.verifyAccount);
router.post('/otp/resend', authController.resendOTP);

// System Initialization (Admin Setup)
router.get('/admin-exists', authController.checkAdminExists);
router.post('/admin-register', authController.registerAdmin);

// Protected Routes
router.post('/logout', auth, authController.logout);

module.exports = router;
