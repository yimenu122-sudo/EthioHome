/**
 * @file response.js
 * @description Standardized API response utility for EthioHome
 */

/**
 * Success Response
 * @param {object} res - Express response object
 * @param {any} data - Data to send
 * @param {string} message - Success message
 * @param {number} status - HTTP status code
 */
const successResponse = (res, data, message = 'Success', status = 200) => {
  return res.status(status).json({
    success: true,
    message,
    data
  });
};

/**
 * Error Response
 * @param {object} res - Express response object
 * @param {string} message - Error message
 * @param {number} status - HTTP status code
 * @param {any} error - Detailed error if any
 */
const errorResponse = (res, message = 'Error', status = 500, error = null) => {
  const response = {
    success: false,
    message
  };

  if (error) {
    response.error = error;
  }

  return res.status(status).json(response);
};

// Also export as a class for compatibility with other patterns if needed
class ResponseUtil {
  static success(res, data, message_en, message_am) {
    return res.status(200).json({
      success: true,
      message: message_en,
      message_am: message_am,
      data,
    });
  }

  static created(res, data, message_en, message_am) {
    return res.status(201).json({
      success: true,
      message: message_en,
      message_am: message_am,
      data,
    });
  }

  static error(res, statusCode, message_en, message_am) {
    return res.status(statusCode).json({
      success: false,
      message: message_en,
      message_am: message_am,
    });
  }
}

module.exports = {
  successResponse,
  errorResponse,
  ResponseUtil
};
