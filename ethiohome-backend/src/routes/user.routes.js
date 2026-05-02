/**
 * @file user.routes.js
 * @description User profile management routes
 * @author Senior Node.js Developer
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');
const { ROLES } = require('../config/roles');

// All routes are protected
router.use(auth);

router.get('/me', userController.getProfile);
router.put('/me', userController.updateProfile);
router.delete('/me', userController.deleteAccount);
router.put('/me/language', userController.updateLanguage);
router.put('/me/password', userController.changePassword);

// Identity verification restricted to Owner and Agent
router.post('/me/verify-identity', 
  role([ROLES.OWNER, ROLES.AGENT]), 
  userController.verifyIdentity
);

module.exports = router;
