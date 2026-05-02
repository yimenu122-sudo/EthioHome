/**
 * @file auth.service.js
 * @description Authentication and user security business logic
 */

const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const { generateToken, generateRefreshToken } = require('../config/jwt');

class AuthService {
  /**
   * Register a new user
   */
  async registerUser(userData) {
    const { phone_number, password } = userData;

    // Check availability
    const existing = await User.findOne({ where: { phone_number } });
    if (existing) throw new Error('Phone number already in use');

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      ...userData,
      password_hash,
      status: 'Pending'
    });

    return user;
  }

  /**
   * Authenticate user
   */
  async loginUser(phone_number, password) {
    const user = await User.findOne({ where: { phone_number } });
    if (!user) throw new Error('Invalid credentials');

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) throw new Error('Invalid credentials');

    if (user.status === 'Inactive') throw new Error('Account is deactivated');

    const token = generateToken({ id: user.user_id, email: user.email, role: user.role });
    const refreshToken = generateRefreshToken(user.user_id);

    return { user, token, refreshToken };
  }

  /**
   * Password hashing helper
   */
  async hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  }

  /**
   * Compare passwords helper
   */
  async comparePassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }
}

module.exports = new AuthService();
