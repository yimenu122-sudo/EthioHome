const Joi = require('joi');

/**
 * @file sub-city.validation.js
 * @description Validation schemas for SubCity management
 */

const subCitySchema = Joi.object({
  name_en: Joi.string().min(2).max(100).required()
    .messages({
      'string.empty': 'English name is required',
      'string.min': 'English name must be at least 2 characters long',
    }),
  name_am: Joi.string().min(2).max(100).required()
    .messages({
      'string.empty': 'Amharic name is required',
      'string.min': 'Amharic name must be at least 2 characters long',
    }),
  is_active: Joi.boolean().default(true),
});

const subCityIdSchema = Joi.object({
  id: Joi.string().guid({ version: 'uuidv4' }).required(),
});

module.exports = {
  subCitySchema,
  subCityIdSchema
};
