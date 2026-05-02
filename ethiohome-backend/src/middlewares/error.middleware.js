/**
 * @file error.middleware.js
 * @description Centralized Global Error Handler for EthioHome Backend
 */

const { NODE_ENV } = require('../config/env');

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (NODE_ENV === 'development') {
    // Detailed error for developers
    res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
      stack: err.stack,
      error: err
    });
  } else {
    // Production: Lean and secure error response
    if (err.isOperational) {
      // Handled operational errors
      res.status(err.statusCode).json({
        success: false,
        message: err.message
      });
    } else {
      // Unhandled programming or external errors
      console.error('ERROR 💥', err);
      res.status(500).json({
        success: false,
        message: 'Something went very wrong on our end.'
      });
    }
  }
};
