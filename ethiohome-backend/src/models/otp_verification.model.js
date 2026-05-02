/**
 * @file otp_verification.model.js
 * @description Model for handling OTP verifications using raw SQL
 */
const { pool } = require("../config/db");

class OTPVerificationModel {
  static async create(userId, otpHash, expiresAt) {
    const query = `
      INSERT INTO otp_verifications (user_id, otp_hash, expires_at)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [userId, otpHash, expiresAt]);
    return rows[0];
  }

  static async findLatestActive(userId) {
    const query = `
      SELECT * FROM otp_verifications
      WHERE user_id = $1 AND is_used = false AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1;
    `;
    const { rows } = await pool.query(query, [userId]);
    return rows[0];
  }

  static async incrementAttempts(otpId) {
    const query = `
      UPDATE otp_verifications
      SET attempts = attempts + 1
      WHERE otp_id = $1
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [otpId]);
    return rows[0];
  }

  static async markAsUsed(otpId) {
    const query = `
      UPDATE otp_verifications
      SET is_used = true
      WHERE otp_id = $1
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [otpId]);
    return rows[0];
  }

  /**
   * Delete old/expired OTPs for a user to keep the table clean
   */
  static async cleanOldOTPs(userId) {
    const query = `
      DELETE FROM otp_verifications
      WHERE user_id = $1 AND (is_used = true OR expires_at < NOW());
    `;
    await pool.query(query, [userId]);
  }
}

module.exports = OTPVerificationModel;
