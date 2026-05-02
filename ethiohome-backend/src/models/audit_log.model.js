/**
 * @file audit_log.model.js
 * @description Raw SQL Audit Log model for administrative tracking
 */
const { pool } = require("../config/db");

class AuditLogModel {
  /**
   * Log an administrative or sensitive action
   * @param {object} data - The audit log data
   */
  static async log(data) {
    const query = `
      INSERT INTO audit_logs
      (admin_id, action, table_name, record_id, old_values, new_values, ip_address)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    
    const values = [
      data.admin_id,
      data.action,
      data.table_name,
      data.record_id,
      data.old_values || null,
      data.new_values || null,
      data.ip_address,
    ];

    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async findAll() {
    const { rows } = await pool.query(`SELECT * FROM audit_logs ORDER BY created_at DESC`);
    return rows;
  }
}

module.exports = AuditLogModel;
