/**
 * @file password.js
 * @description Utility for secure password hashing and comparison
 */

const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 12;

class PasswordUtil {
  /**
   * Hashes a plain text password
   * @param {string} password 
   * @returns {Promise<string>}
   */
  static async hash(password) {
    return await bcrypt.hash(password, SALT_ROUNDS);
  }

  /**
   * Compares a plain text password with a hashed password
   * @param {string} password 
   * @param {string} hashedPassword 
   * @returns {Promise<boolean>}
   */
  static async compare(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }
}

module.exports = PasswordUtil;
