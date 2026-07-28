const Joi = require('joi');

/**
 * @file land-manager-mgmt.validation.js
 * @description Validation for Agent managing Land Managers
 */

const registerLandManagerSchema = Joi.object({
  first_name: Joi.string().min(2).max(100).required().trim(),
  last_name: Joi.string().min(2).max(100).required().trim(),
  phone_number: Joi.string().pattern(/^(?:\+251|0)[79]\d{8}$/).required()
    .messages({
      'string.pattern.base': 'Please provide a valid Ethiopian phone number (+251... or 09...)'
    }),
  email: Joi.string().email().required().trim().lowercase(),
  national_id: Joi.string().min(6).max(20).required().trim(),
  city: Joi.string().allow('').optional(),
  preferred_language: Joi.string().valid('English', 'Amharic').default('English'),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters long'
  }),
  profile_image: Joi.string().optional().allow('')
});

const updateLandManagerSchema = Joi.object({
  first_name: Joi.string().min(2).max(100).trim(),
  last_name: Joi.string().min(2).max(100).trim(),
  phone_number: Joi.string().pattern(/^(?:\+251|0)[79]\d{8}$/)
    .messages({
      'string.pattern.base': 'Please provide a valid Ethiopian phone number (+251... or 09...)'
    }),
  email: Joi.string().email().trim().lowercase(),
  national_id: Joi.string().min(6).max(20).trim(),
  city: Joi.string(),
  preferred_language: Joi.string().valid('English', 'Amharic'),
  profile_image: Joi.string().optional().allow('')
});

module.exports = {
  registerLandManagerSchema,
  updateLandManagerSchema
};
