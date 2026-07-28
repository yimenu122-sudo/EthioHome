/**
 * @file land-manager-mgmt.controller.js
 * @description Controller for Agent managing Land Managers
 */
const User = require('../models/user.model');
const AuditLog = require('../models/audit_log.model');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

class LandManagerMgmtController {
  /**
   * Register a new Land Manager
   */
  async register(req, res) {
    const client = await pool.connect();
    try {
      const { first_name, last_name, phone_number, email, national_id, city, password, preferred_language } = req.body;

      // 1. Authorization check: Agent can only manage their own city
      if (req.user.role === 'Agent') {
        const agent = await User.findById(req.user.id);
        if (!agent || !agent.city) {
          return res.status(403).json({ status: 'error', message: 'Agent must have an assigned city to manage Land Managers' });
        }
        // Force the city to match the agent's city to prevent mismatches/spoofing
        req.body.city = agent.city;
      }
      
      const cityToUse = req.body.city;

      // 2. Duplicate checks
      const existingPhone = await User.findByPhone(phone_number);
      if (existingPhone) return res.status(400).json({ status: 'error', message: 'Phone number already registered' });

      const existingEmail = await User.findByEmail(email);
      if (existingEmail) return res.status(400).json({ status: 'error', message: 'Email already registered' });

      const existingId = await User.findByNationalId(national_id);
      if (existingId) return res.status(400).json({ status: 'error', message: 'National ID already registered' });

      // 3. Hash password
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);

      // 4. Create user within a transaction
      await client.query('BEGIN');
      
      const newUser = await User.create({
        first_name,
        last_name,
        phone_number,
        email,
        national_id,
        city: cityToUse,
        password_hash,
        role: 'Land_Manager',
        status: 'Active',
        is_verified: true,
        preferred_language
      });

      // 5. Log audit (Wrapped in try-catch to prevent 500 if audit table has issues)
      try {
        await AuditLog.create({
          admin_id: req.user.id,
          action: 'REGISTER_LAND_MANAGER',
          table_name: 'users',
          record_id: newUser.user_id,
          new_values: { email: newUser.email, role: 'Land_Manager' },
          ip_address: req.ip,
          user_agent: req.headers['user-agent']
        });
      } catch (auditError) {
        console.error('Failed to create audit log:', auditError.message);
        // We don't throw here so the user registration still succeeds
      }

      await client.query('COMMIT');
      res.status(201).json({ status: 'success', data: newUser });
    } catch (error) {
      if (client) await client.query('ROLLBACK');
      console.error('Registration Error:', error);
      res.status(500).json({ status: 'error', message: error.message });
    } finally {
      if (client) client.release();
    }
  }

  /**
   * Get all Land Managers in the Agent's city
   */
  async getAll(req, res) {
    try {
      const { search, status, page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;
      
      const agent = await User.findById(req.user.id);
      const city = agent.city;

      let query = `
        SELECT user_id, first_name, last_name, phone_number, email, national_id, city, preferred_language, role, status, is_verified, profile_image, created_at
        FROM users
        WHERE role = 'Land_Manager' AND city = $1
      `;
      const params = [city];

      if (search) {
        params.push(`%${search}%`);
        query += ` AND (first_name ILIKE $${params.length} OR last_name ILIKE $${params.length} OR email ILIKE $${params.length})`;
      }

      if (status) {
        params.push(status);
        query += ` AND status = $${params.length}`;
      }

      query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const { rows } = await pool.query(query, params);
      const countResult = await pool.query(`SELECT COUNT(*) FROM users WHERE role = 'Land_Manager' AND city = $1`, [city]);

      res.status(200).json({
        status: 'success',
        results: rows.length,
        total: parseInt(countResult.rows[0].count),
        data: rows
      });
    } catch (error) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  }

  /**
   * Toggle Land Manager status
   */
  async toggleStatus(req, res) {
    try {
      const { id } = req.params;
      const targetUser = await User.findById(id);

      if (!targetUser || targetUser.role !== 'Land_Manager') {
        return res.status(404).json({ status: 'error', message: 'Land Manager not found' });
      }

      // Authorization check
      const agent = await User.findById(req.user.id);
      if (targetUser.city !== agent.city) {
        return res.status(403).json({ status: 'error', message: 'Unauthorized access' });
      }

      const newStatus = targetUser.status === 'Active' ? 'Inactive' : 'Active';
      
      const query = `UPDATE users SET status = $1, updated_at = NOW() WHERE user_id = $2 RETURNING *`;
      const { rows } = await pool.query(query, [newStatus, id]);

      await AuditLog.create({
        admin_id: req.user.id,
        action: 'TOGGLE_LAND_MANAGER_STATUS',
        table_name: 'users',
        record_id: id,
        old_values: { status: targetUser.status },
        new_values: { status: newStatus },
        ip_address: req.ip
      });

      res.status(200).json({ status: 'success', data: rows[0] });
    } catch (error) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  }

  /**
   * Update a Land Manager
   */
  async update(req, res) {
    const client = await pool.connect();
    try {
      const { id } = req.params;
      const { first_name, last_name, phone_number, email, national_id, city, preferred_language } = req.body;

      const targetUser = await User.findById(id);
      if (!targetUser || targetUser.role !== 'Land_Manager') {
        return res.status(404).json({ status: 'error', message: 'Land Manager not found' });
      }

      // Authorization check (Agent can only manage their own city)
      const agent = await User.findById(req.user.id);
      if (targetUser.city !== agent.city) {
        return res.status(403).json({ status: 'error', message: 'Unauthorized access' });
      }

      // Duplicate checks (excluding the current user being updated)
      if (phone_number && phone_number !== targetUser.phone_number) {
        const existingPhone = await User.findByPhone(phone_number);
        if (existingPhone) return res.status(400).json({ status: 'error', message: 'Phone number already registered' });
      }

      if (email && email !== targetUser.email) {
        const existingEmail = await User.findByEmail(email);
        if (existingEmail) return res.status(400).json({ status: 'error', message: 'Email already registered' });
      }

      if (national_id && national_id !== targetUser.national_id) {
        const existingId = await User.findByNationalId(national_id);
        if (existingId) return res.status(400).json({ status: 'error', message: 'National ID already registered' });
      }

      await client.query('BEGIN');

      const query = `
        UPDATE users 
        SET 
          first_name = COALESCE($1, first_name),
          last_name = COALESCE($2, last_name),
          phone_number = COALESCE($3, phone_number),
          email = COALESCE($4, email),
          national_id = COALESCE($5, national_id),
          city = COALESCE($6, city),
          preferred_language = COALESCE($7, preferred_language),
          updated_at = NOW()
        WHERE user_id = $8
        RETURNING user_id, first_name, last_name, phone_number, email, national_id, city, role, status, is_verified, preferred_language
      `;

      const { rows } = await client.query(query, [
        first_name, last_name, phone_number, email, national_id, city, preferred_language, id
      ]);

      await AuditLog.create({
        admin_id: req.user.id,
        action: 'UPDATE_LAND_MANAGER',
        table_name: 'users',
        record_id: id,
        new_values: req.body,
        ip_address: req.ip
      });

      await client.query('COMMIT');
      res.status(200).json({ status: 'success', data: rows[0] });
    } catch (error) {
      if (client) await client.query('ROLLBACK');
      console.error('Update Error:', error);
      res.status(500).json({ status: 'error', message: error.message });
    } finally {
      if (client) client.release();
    }
  }

  /**
   * Get statistics
   */
  async getStatistics(req, res) {
    try {
      const agent = await User.findById(req.user.id);
      const city = agent.city;

      const query = `
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'Active' THEN 1 END) as active,
          COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending,
          COUNT(CASE WHEN status = 'Inactive' THEN 1 END) as inactive
        FROM users 
        WHERE role = 'Land_Manager' AND city = $1
      `;
      const { rows } = await pool.query(query, [city]);

      res.status(200).json({ status: 'success', data: rows[0] });
    } catch (error) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  }
}

module.exports = new LandManagerMgmtController();
