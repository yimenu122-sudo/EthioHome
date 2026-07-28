/**
 * @file notification.controller.js
 */
const Notification = require('../models/notification.model');
const { successResponse, errorResponse } = require('../utils/response');

exports.getMyNotifications = async (req, res) => {
  try {
    const user_id = req.user.id;
    const notifications = await Notification.findAll({
      where: { user_id },
      order: [['created_at', 'DESC']]
    });

    return successResponse(res, notifications, 'Notifications fetched');
  } catch (error) {
    console.error('Fetch notifications error:', error);
    return errorResponse(res, 'Failed to fetch notifications', 500);
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const user_id = req.user.id;
    await Notification.update(
      { is_read: true, read_at: new Date() },
      { where: { user_id, is_read: false } }
    );
    return successResponse(res, null, 'Marked as read');
  } catch (error) {
    return errorResponse(res, 'Failed to mark as read', 500);
  }
};
