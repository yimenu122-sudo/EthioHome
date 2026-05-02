/**
 * @file validators.js
 * @description Input validation schemas using Joi
 */

const Joi = require('joi');

/**
 * AUTH VALIDATION SCHEMAS
 */
const registerSchema = Joi.object({
  first_name: Joi.string().min(2).max(100).required(),
  last_name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().optional(),
  phone_number: Joi.string().min(9).max(15).required(),
  national_id: Joi.string().min(5).max(12).required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('Admin', 'Agent', 'Owner', 'Renter', 'Buyer').required(),
  preferred_language: Joi.string().valid('English', 'Amharic').default('English'),
});

const loginSchema = Joi.object({
  phone_number: Joi.string().required(),
  password: Joi.string().required(),
});

/**
 * PROPERTY VALIDATION SCHEMAS
 */
const propertySchema = Joi.object({
  title: Joi.string().max(50).required(),
  description: Joi.string().required(),
  city: Joi.string().max(50).required(),
  sub_city: Joi.string().max(50).required(),
  woreda: Joi.string().max(50).optional(),
  kebele: Joi.string().max(50).optional(),
  specific_location: Joi.string().required(),
  price: Joi.number().positive().required(),
  property_type: Joi.string().max(50).required(),
  listing_type: Joi.string().valid('Rent', 'Sale').required(),
  property_image: Joi.string().required(),
  number_of_bedrooms: Joi.number().integer().min(0).required(),
  number_of_bathrooms: Joi.number().integer().min(0).required(),
  number_of_living_rooms: Joi.number().integer().min(0).default(1),
  number_of_kitchens: Joi.number().integer().min(0).default(1),
  number_of_floors: Joi.number().integer().min(0).default(1),
  area_size: Joi.number().positive().required(),
});

/**
 * BOOKING VALIDATION SCHEMAS
 */
const bookingSchema = Joi.object({
  property_id: Joi.string().uuid().required(),
  visit_date: Joi.date().iso().required(),
  message: Joi.string().required(),
});

module.exports = {
  registerSchema,
  loginSchema,
  propertySchema,
  bookingSchema
};
