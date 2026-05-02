/**
 * @file auth.middleware.js
 * @description Professional JWT Verification Middleware for EthioHome
 */

const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');
const AppError = require('../utils/AppError');

/**
 * Middleware to authenticate requests using JWT
 */
module.exports = function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    // 1. Check if token exists
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('Authentication required. Please log in.', 401));
    }

    // 2. Extract token
    const token = authHeader.split(' ')[1];

    // 3. Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // 4. Attach user data to request
    // decoded contains: { id, role, email, etc. }
    req.user = decoded;

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Your token has expired. Please log in again.', 401));
    }
    return next(new AppError('Invalid token. Authentication failed.', 401));
  }
};
