/**
 * @file app.js
 * @description Express Application Configuration - Core Application Setup
 * @author Senior Node.js Developer
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');

// Internal Imports
const routes = require('./routes');
const { NODE_ENV } = require('./config/env');
const errorMiddleware = require('./middlewares/error.middleware');
const { errorResponse } = require('./utils/response');

// Initialize Model Associations
require('./models/associations');

// Initialize Express App
const app = express();

/**
 * PRODUCTION MIDDLEWARES
 */

// 1. Security Headers (Helmet)
// Restrictive in production, permissive in development to avoid blocking localhost APIs
if (NODE_ENV === 'development') {
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: false,
  }));
} else {
  app.use(helmet());
}

// 2. Cross-Origin Resource Sharing
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language']
})); // Fully permissive for development to eliminate CORS as a variable

// Rate limiting moved after routes for dev safety

// 4. Request Logging (Morgan)
// Log all requests regardless of environment to debug connection issues
app.use(morgan('combined'));

// 5. Body Parsers
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// 6. Static Files Assets
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

/**
 * INTERNATIONALIZATION (i18n) MIDDLEWARE
 * Sets the locale based on the 'Accept-Language' header
 */
app.use((req, res, next) => {
  const lang = req.headers['accept-language'] || 'en';
  req.language = lang.startsWith('am') ? 'am' : 'en';
  next();
});

/**
 * API ROUTES
 */

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'EthioHome API is healthy and running',
    timestamp: new Date().toISOString(),
    env: NODE_ENV
  });
});

// Versioned API Routes (v1)
app.use('/api/v1', routes);

// Root Endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Welcome to EthioHome REST API',
    version: '1.0.0'
  });
});

/**
 * ERROR HANDLING
 */

// 404 Route Not Found
app.use((req, res) => {
  return errorResponse(res, `Route ${req.originalUrl} not found`, 404);
});

// Global Error Handler (Production Ready)
app.use(errorMiddleware);

// Rate Limiting (Prevent Brute Force/DoS) - Applied last
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 500, // Increased for dev
  message: {
    status: 'error',
    message: 'Too many requests'
  },
});
app.use('/api/', limiter);

module.exports = app;
