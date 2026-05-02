/**
 * @file jwt.js
 * @description JWT Configuration & Token Helpers
 * @author Senior Node.js Developer
 */

const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('./env');

/**
 * 1️⃣ JWT CONFIGURATION
 */
const jwtConfig = {
  secret: JWT_SECRET,
  expiresIn: JWT_EXPIRES_IN,
  refreshExpiresIn: '30d', // Long-lived refresh token
};

/**
 * 2️⃣ TOKEN GENERATION
 * @param {object} user - User object containing id and role
 * @returns {string} Signed JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      phone: user.phone,
    },
    jwtConfig.secret,
    {
      expiresIn: jwtConfig.expiresIn,
    }
  );
};

/**
 * 3️⃣ REFRESH TOKEN GENERATION
 * @param {string} userId - User ID
 * @returns {string} Signed Refresh token
 */
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    jwtConfig.secret,
    {
      expiresIn: jwtConfig.refreshExpiresIn,
    }
  );
};

/**
 * 4️⃣ TOKEN VERIFICATION
 * @param {string} token - JWT token string
 * @returns {object|null} Decoded payload or null if invalid
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, jwtConfig.secret);
  } catch (error) {
    return null;
  }
};

module.exports = {
  ...jwtConfig,
  generateToken,
  generateRefreshToken,
  verifyToken,
};
