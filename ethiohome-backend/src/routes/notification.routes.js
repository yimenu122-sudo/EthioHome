const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const authenticate = require('../middlewares/auth.middleware');

router.use(authenticate);

router.get('/', notificationController.getMyNotifications);
router.post('/mark-read', notificationController.markAsRead);

module.exports = router;
