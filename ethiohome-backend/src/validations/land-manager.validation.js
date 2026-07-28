const Joi = require('joi');

/**
 * @file land-manager.validation.js
 * @description Joi validation schemas for Land Manager module
 */

const rejectPropertySchema = Joi.object({
  reason: Joi.string().min(5).max(500).required()
    .messages({
      'string.empty': 'Rejection reason is required',
      'string.min': 'Rejection reason must be at least 5 characters long',
      'any.required': 'Rejection reason is required'
    })
});

const propertyIdSchema = Joi.object({
  id: Joi.string().guid({ version: 'uuidv4' }).required()
});

module.exports = {
  rejectPropertySchema,
  propertyIdSchema
};
