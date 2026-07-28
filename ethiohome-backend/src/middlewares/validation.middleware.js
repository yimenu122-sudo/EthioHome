/**
 * @file validation.middleware.js
 * @description Universal Joi validation middleware
 */

/**
 * Middleware to validate request data against a Joi schema
 * @param {Object} schema - Joi validation schema
 * @param {string} [property='body'] - Request property to validate (body, params, query)
 * @returns {Function} Express middleware
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error } = schema.validate(req[property]);
    
    if (error) {
      const message = error.details[0].message;
      return res.status(400).json({
        status: 'error',
        message: message.replace(/["]/g, '')
      });
    }
    
    next();
  };
};

module.exports = validate;
