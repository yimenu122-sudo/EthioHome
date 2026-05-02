/**
 * @file user.model.js
 * @description Raw SQL User model mapping to projects database.sql
 */
const { pool } = require("../config/db");

class UserModel {
  static async countByRole(role) {
    const { rows } = await pool.query(
      `SELECT COUNT(*) FROM users WHERE role = $1`,
      [role]
    );
    return parseInt(rows[0].count);
  }

  static async create(userData) {
    const query = `
      INSERT INTO users
      (first_name, last_name, phone_number, email, national_id, city, password_hash, role, preferred_language, status, is_verified, provider, provider_id, profile_image)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *;
    `;

    const values = [
      userData.first_name,
      userData.last_name,
      userData.phone_number,
      userData.email,
      userData.national_id,
      userData.city || 'Addis Ababa',
      userData.password_hash || null,
      userData.role || 'Renter',
      userData.preferred_language || 'English',
      userData.status || 'Pending',
      userData.is_verified || false,
      userData.provider || null,
      userData.provider_id || null,
      userData.profile_image || null,
    ];

    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async createAdmin(userData) {
    const query = `
      INSERT INTO users
      (first_name, last_name, phone_number, email, national_id, city, password_hash, role, status, is_verified, preferred_language)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'Admin', 'Active', true, $8)
      RETURNING *;
    `;

    const values = [
      userData.first_name,
      userData.last_name,
      userData.phone_number,
      userData.email,
      userData.national_id,
      userData.city,
      userData.password_hash,
      userData.preferred_language || 'English',
    ];

    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async findByPhone(phone) {
    const { rows } = await pool.query(
      `SELECT * FROM users WHERE phone_number = $1`,
      [phone]
    );
    return rows[0];
  }

  static async findByEmail(email) {
    const { rows } = await pool.query(
      `SELECT * FROM users WHERE email = $1`,
      [email]
    );
    return rows[0];
  }

  static async findByNationalId(nationalId) {
    const { rows } = await pool.query(
      `SELECT * FROM users WHERE national_id = $1`,
      [nationalId]
    );
    return rows[0];
  }

  static async findByIdentifier(identifier) {
    const query = `
      SELECT * FROM users 
      WHERE phone_number = $1 OR email = $2
      LIMIT 1;
    `;
    const { rows } = await pool.query(query, [identifier, identifier]);
    return rows[0];
  }

  static async findById(id) {
    const { rows } = await pool.query(
      `SELECT * FROM users WHERE user_id = $1`,
      [id]
    );
    return rows[0];
  }

  static async updateProfile(id, data) {
    const query = `
      UPDATE users
      SET first_name = $1,
          last_name = $2,
          email = $3,
          preferred_language = $4,
          city = $5,
          updated_at = NOW()
      WHERE user_id = $6
      RETURNING *;
    `;

    const { rows } = await pool.query(query, [
      data.first_name,
      data.last_name,
      data.email,
      data.preferred_language,
      data.city,
      id,
    ]);

    return rows[0];
  }

  static async updatePassword(id, hashedPassword) {
    const query = `
      UPDATE users
      SET password_hash = $1,
          updated_at = NOW()
      WHERE user_id = $2
      RETURNING user_id;
    `;
    const { rows } = await pool.query(query, [hashedPassword, id]);
    return rows[0];
  }

  static async updateLastLogin(id) {
    const query = `
      UPDATE users
      SET last_login = NOW()
      WHERE user_id = $1
      RETURNING user_id;
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0];
  }

  static async verify(id) {
    const query = `
      UPDATE users
      SET is_verified = true,
          status = 'Active',
          updated_at = NOW()
      WHERE user_id = $1
      RETURNING user_id;
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0];
  }
}

module.exports = UserModel;
