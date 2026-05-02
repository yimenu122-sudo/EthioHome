/**
 * @file audit.middleware.js
 * @description Activity tracking middleware for sensitive actions
 */

const AuditLog = require('../models/audit_log.model');

/**
 * Middleware to track user actions and log them to the database
 * @param {string} actionDescription - Human readable description of the action
 */
module.exports = function audit(actionDescription) {
  return async (req, res, next) => {
    try {
      // Only log if user is authenticated (attached by auth.middleware)
      if (req.user) {
        // Run audit in background so it doesn't block the request
        AuditLog.create({
          admin_id: req.user.role === 'Admin' ? req.user.id : null,
          action: actionDescription || `${req.method} ${req.originalUrl}`,
          table_name: req.originalUrl.split('/')[3] || 'unknown', // e.g., 'properties', 'auth'
          record_id: req.params.id || null,
          new_values: req.method !== 'GET' ? req.body : null,
          ip_address: req.ip
        }).catch(err => console.error('Background Audit Log Failed:', err));
      }

      next();
    } catch (error) {
      // We don't want audit failure to break the main application flow
      console.error('Audit Logging Middleware Error:', error);
      next();
    }
  };
};
