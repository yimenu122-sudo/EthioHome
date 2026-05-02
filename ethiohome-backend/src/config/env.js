/**
 * @file env.js
 * @description Centralized Environment Configuration with validation
 * @author Senior Node.js Developer
 */

require('dotenv').config();

const requiredEnvVars = [
  'DB_HOST',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME',
  'JWT_SECRET'
];

// Validate that required environment variables are set
const missingEnvVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error(`❌ CRITICAL: Missing required environment variables: ${missingEnvVars.join(', ')}`);
  console.warn('⚠️ Please check your .env file.');
  process.exit(1); // Stop the server from starting
}

const config = {
  // Application
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 3000,
  
  // Database (PostgreSQL)
  DB_HOST: process.env.DB_HOST,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_NAME: process.env.DB_NAME,
  DB_PORT: parseInt(process.env.DB_PORT, 10) || 5432,
  DB_SSL: process.env.DB_SSL === 'true', // For production RDS/Cloud SQL
  
  // Security
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  
  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  
  // Uploads
  UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE, 10) || 5 * 1024 * 1024, // 5MB default

  // Cloudinary (Image Hosting for property photos)
  // Sign up at https://cloudinary.com and add these to your .env file
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY:    process.env.CLOUDINARY_API_KEY    || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
};

module.exports = config;
