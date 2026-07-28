/**
 * @file role.middleware.js
 * @description Role-Based Access Control (RBAC) enforcement middleware
 */

const AppError = require('../utils/AppError');

/**
 * Middleware to restrict access to specific roles
 * @param {...string} allowedRoles - List of roles permitted to access the route
 */
module.exports = function authorize(...args) {
  // Support both authorize('Role1', 'Role2') and authorize(['Role1', 'Role2'])
  const allowedRoles = args.flat();

  return (req, res, next) => {
    // 1. Ensure user is authenticated
    if (!req.user) {
      return next(new AppError('Unauthorized. Please log in first.', 401));
    }

    // 2. Check if user role is in the allowed list
    // Admin always has access to everything
    const userRole = req.user.role;
    const isAllowed = allowedRoles.includes(userRole) || userRole === 'Admin';

    if (!isAllowed) {
      return next(new AppError(`Forbidden: Access denied for role: ${userRole}`, 403));
    }

    next();
  };
};
