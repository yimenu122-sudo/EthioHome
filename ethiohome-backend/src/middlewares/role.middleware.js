/**
 * @file role.middleware.js
 * @description Role-Based Access Control (RBAC) enforcement middleware
 */

const AppError = require('../utils/AppError');

/**
 * Middleware to restrict access to specific roles
 * @param {...string} allowedRoles - List of roles permitted to access the route
 */
module.exports = function authorize(...allowedRoles) {
  return (req, res, next) => {
    // 1. Ensure user is authenticated
    if (!req.user) {
      return next(new AppError('Unauthorized. Please log in first.', 401));
    }

    // 2. Check if user role is in the allowed list
    // Admin always has access to everything
    if (!allowedRoles.includes(req.user.role) && req.user.role !== 'Admin') {
      return next(new AppError(`Forbidden: Access denied for role: ${req.user.role}`, 403));
    }

    next();
  };
};
