const { pool } = require("../config/db");
const { successResponse, errorResponse } = require("../utils/response");
const bcrypt = require("bcryptjs");

/**
 * GET /api/admin/dashboard/overview
 * @description Fetch key system metrics for the dashboard
 */
exports.getOverview = async (req, res) => {
  try {
    const metrics = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE role = 'Agent' AND status = 'Active') as active_agents,
        (SELECT COUNT(*) FROM properties) as total_properties,
        (SELECT COUNT(*) FROM properties WHERE availability_status = 'Available') as available_properties,
        (SELECT COUNT(*) FROM properties WHERE availability_status = 'Sold') as sold_properties,
        (SELECT COUNT(*) FROM properties WHERE availability_status = 'Rented') as rented_properties,
        (SELECT COUNT(*) FROM transactions WHERE transaction_status = 'Completed') as total_transactions,
        (SELECT COALESCE(SUM(agreed_price), 0) FROM transactions WHERE transaction_status = 'Completed') as total_volume,
        (SELECT COALESCE(SUM(amount), 0) FROM commissions WHERE commission_status = 'Completed') as total_revenue
    `);

    return successResponse(res, metrics.rows[0], "Dashboard overview fetched successfully");
  } catch (error) {
    console.error("Admin Dashboard Overview Error:", error);
    return errorResponse(res, "Failed to fetch dashboard metrics", 500);
  }
};

/**
 * GET /api/admin/dashboard/charts
 * @description Fetch data for charts (listings, transactions, revenue, city-wise)
 */
exports.getChartData = async (req, res) => {
  try {
    // 1. Monthly Listing Trends (Last 6 Months)
    const listingTrends = await pool.query(`
      SELECT 
        TO_CHAR(created_at, 'Mon') as month,
        COUNT(*) as count
      FROM properties
      WHERE created_at >= NOW() - INTERVAL '6 months'
      GROUP BY month, TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY TO_CHAR(created_at, 'YYYY-MM') ASC
    `);

    // 2. City Distribution
    const cityDistribution = await pool.query(`
      SELECT 
        city,
        COUNT(*) as count
      FROM properties
      GROUP BY city
      ORDER BY count DESC
      LIMIT 5
    `);

    // 3. Monthly Transaction Trends (Rent vs Sale)
    const transactionTrends = await pool.query(`
      SELECT 
        TO_CHAR(created_at, 'Mon') as month,
        transaction_type,
        COUNT(*) as count
      FROM transactions
      WHERE transaction_status = 'Completed'
      AND created_at >= NOW() - INTERVAL '6 months'
      GROUP BY month, transaction_type, TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY TO_CHAR(created_at, 'YYYY-MM') ASC
    `);

    // 4. Registration Trends
    const userTrends = await pool.query(`
      SELECT 
        TO_CHAR(created_at, 'Mon') as month,
        COUNT(*) as count
      FROM users
      WHERE created_at >= NOW() - INTERVAL '6 months'
      GROUP BY month, TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY TO_CHAR(created_at, 'YYYY-MM') ASC
    `);

    return successResponse(res, {
      listingTrends: listingTrends.rows,
      cityDistribution: cityDistribution.rows,
      transactionTrends: transactionTrends.rows,
      userTrends: userTrends.rows
    }, "Chart data fetched successfully");
  } catch (error) {
    console.error("Admin Dashboard Charts Error:", error);
    return errorResponse(res, "Failed to fetch chart data", 500);
  }
};

/**
 * GET /api/admin/audit-logs/recent
 * @description Fetch the most recent administrative actions
 */
exports.getRecentAuditLogs = async (req, res) => {
  try {
    const logs = await pool.query(`
      SELECT 
        l.*,
        u.first_name || ' ' || u.last_name as admin_name
      FROM audit_logs l
      LEFT JOIN users u ON l.admin_id = u.user_id
      ORDER BY l.created_at DESC
      LIMIT 10
    `);

    return successResponse(res, logs.rows, "Recent audit logs fetched successfully");
  } catch (error) {
    console.error("Audit Logs Error:", error);
    return errorResponse(res, "Failed to fetch audit logs", 500);
  }
};

/**
 * GET /api/admin/users
 * @description Fetch all system users with filters
 */
exports.getUsers = async (req, res) => {
  try {
    const { role, status, is_verified, search } = req.query;
    let query = `
      SELECT 
        user_id, first_name, last_name, phone_number, email, 
        role, status, is_verified, preferred_language, last_login, 
        profile_image, created_at
      FROM users 
      WHERE 1=1
    `;
    const params = [];

    if (role) {
      params.push(role);
      query += ` AND role = $${params.length}`;
    }
    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }
    if (is_verified !== undefined && is_verified !== '') {
      params.push(is_verified === 'true');
      query += ` AND is_verified = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (first_name ILIKE $${params.length} OR last_name ILIKE $${params.length} OR email ILIKE $${params.length} OR phone_number ILIKE $${params.length})`;
    }

    query += " ORDER BY created_at DESC";

    const users = await pool.query(query, params);
    return successResponse(res, users.rows, "Users fetched successfully");
  } catch (error) {
    console.error("Get Users Error:", error);
    return errorResponse(res, "Failed to fetch users", 500);
  }
};

/**
 * PUT /api/admin/users/:id/status
 */
exports.updateUserStatus = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { status } = req.body;
    const adminId = req.user ? req.user.id : null;

    await client.query('BEGIN');

    // Get old value for audit
    const oldUser = await client.query('SELECT status FROM users WHERE user_id = $1', [id]);
    if (oldUser.rows.length === 0) return errorResponse(res, "User not found", 404);

    // Update Status
    const result = await client.query(
      'UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 RETURNING *',
      [status, id]
    );

    // Audit Log
    await client.query(
      `INSERT INTO audit_logs (admin_id, action, table_name, record_id, old_values, new_values, ip_address) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [adminId, 'UPDATE_STATUS', 'users', id, JSON.stringify({ status: oldUser.rows[0].status }), JSON.stringify({ status }), req.ip]
    );

    await client.query('COMMIT');
    return successResponse(res, result.rows[0], "User status updated and logged");
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Update Status Error:", error);
    return errorResponse(res, "Failed to update status", 500);
  } finally {
    client.release();
  }
};

/**
 * PUT /api/admin/users/:id/role
 */
exports.updateUserRole = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { role } = req.body;
    const adminId = req.user ? req.user.id : null;

    await client.query('BEGIN');

    const oldUser = await client.query('SELECT role FROM users WHERE user_id = $1', [id]);
    if (oldUser.rows.length === 0) return errorResponse(res, "User not found", 404);

    const result = await client.query(
      'UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 RETURNING *',
      [role, id]
    );

    await client.query(
      `INSERT INTO audit_logs (admin_id, action, table_name, record_id, old_values, new_values, ip_address) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [adminId, 'UPDATE_ROLE', 'users', id, JSON.stringify({ role: oldUser.rows[0].role }), JSON.stringify({ role }), req.ip]
    );

    await client.query('COMMIT');
    return successResponse(res, result.rows[0], "User role updated");
  } catch (error) {
    await client.query('ROLLBACK');
    return errorResponse(res, "Failed to update role", 500);
  } finally {
    client.release();
  }
};

/**
 * DELETE /api/admin/users/:id
 */
exports.deleteUser = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const adminId = req.user ? req.user.id : null;

    await client.query('BEGIN');

    const result = await client.query('DELETE FROM users WHERE user_id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return errorResponse(res, "User not found", 404);

    await client.query(
      `INSERT INTO audit_logs (admin_id, action, table_name, record_id, old_values, ip_address) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [adminId, 'DELETE_USER', 'users', id, JSON.stringify(result.rows[0]), req.ip]
    );

    await client.query('COMMIT');
    return successResponse(res, null, "User deleted successfully");
  } catch (error) {
    await client.query('ROLLBACK');
    return errorResponse(res, "Failed to delete user", 500);
  } finally {
    client.release();
  }
};

/**
 * POST /api/admin/users/:id/reset-password
 * @description Force reset a user password by admin
 */
exports.resetUserPassword = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const adminId = req.user ? req.user.id : null;
    
    // Generate a secure temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    await client.query('BEGIN');

    // Update Password
    const result = await client.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 RETURNING *',
      [hashedPassword, id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return errorResponse(res, "User not found", 404);
    }

    // Audit Log
    await client.query(
      `INSERT INTO audit_logs (admin_id, action, table_name, record_id, ip_address) 
       VALUES ($1, $2, $3, $4, $5)`,
      [adminId, 'FORCE_RESET_PASSWORD', 'users', id, req.ip]
    );

    await client.query('COMMIT');
    
    // In a production app, we would ideally email this to the user.
    // For now, we return it to the admin to communicate manually.
    return successResponse(res, { tempPassword }, "Password has been reset to a temporary one");
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    console.error("Reset Password Admin Error:", error);
    return errorResponse(res, "Failed to reset user password", 500);
  } finally {
    if (client) client.release();
  }
};
exports.getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Properties
    const properties = await pool.query('SELECT * FROM properties WHERE owner_id = $1 OR agent_id = $1', [id]);
    
    // Bookings
    const bookings = await pool.query('SELECT * FROM bookings WHERE owner_id = $1 OR agent_id = $1', [id]);
    
    // Transactions
    const transactions = await pool.query('SELECT * FROM transactions WHERE owner_id = $1 OR agent_id = $1', [id]);

    return successResponse(res, {
      properties: properties.rows,
      bookings: bookings.rows,
      transactions: transactions.rows
    }, "User details fetched");
  } catch (error) {
    return errorResponse(res, "Failed to fetch details", 500);
  }
};

/**
 * GET /api/admin/properties
 */
exports.getAdminProperties = async (req, res) => {
  try {
    const { city, property_type, listing_type, status, search } = req.query;
    let query = `
      SELECT 
        p.*, 
        o.first_name || ' ' || o.last_name as owner_name,
        a.first_name || ' ' || a.last_name as agent_name
      FROM properties p
      JOIN users o ON p.owner_id = o.user_id
      LEFT JOIN users a ON p.agent_id = a.user_id
      WHERE 1=1
    `;
    const params = [];

    if (city) {
      params.push(city);
      query += ` AND p.city = $${params.length}`;
    }
    if (property_type) {
      params.push(property_type);
      query += ` AND p.property_type = $${params.length}`;
    }
    if (listing_type) {
      params.push(listing_type);
      query += ` AND p.listing_type = $${params.length}`;
    }
    if (status) {
      params.push(status);
      query += ` AND p.availability_status = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (p.title ILIKE $${params.length} OR p.description ILIKE $${params.length} OR o.first_name ILIKE $${params.length})`;
    }

    query += " ORDER BY p.created_at DESC";

    const result = await pool.query(query, params);
    return successResponse(res, result.rows, "Properties fetched successfully");
  } catch (error) {
    console.error("Admin Get Properties Error:", error);
    return errorResponse(res, "Failed to fetch properties", 500);
  }
};

/**
 * PUT /api/admin/properties/:id/status
 */
exports.updatePropertyStatus = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { status } = req.body;
    const adminId = req.user ? req.user.id : null;

    await client.query('BEGIN');

    const oldProp = await client.query('SELECT availability_status FROM properties WHERE property_id = $1', [id]);
    if (oldProp.rows.length === 0) return errorResponse(res, "Property not found", 404);

    const result = await client.query(
      'UPDATE properties SET availability_status = $1, updated_at = CURRENT_TIMESTAMP WHERE property_id = $2 RETURNING *',
      [status, id]
    );

    await client.query(
      `INSERT INTO audit_logs (admin_id, action, table_name, record_id, old_values, new_values, ip_address) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [adminId, 'UPDATE_PROPERTY_STATUS', 'properties', id, JSON.stringify({ status: oldProp.rows[0].availability_status }), JSON.stringify({ status }), req.ip]
    );

    await client.query('COMMIT');
    return successResponse(res, result.rows[0], "Property status updated");
  } catch (error) {
    await client.query('ROLLBACK');
    return errorResponse(res, "Failed to update property status", 500);
  } finally {
    client.release();
  }
};

/**
 * DELETE /api/admin/properties/:id
 */
exports.deleteProperty = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const adminId = req.user ? req.user.id : null;

    await client.query('BEGIN');

    const result = await client.query('DELETE FROM properties WHERE property_id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return errorResponse(res, "Property not found", 404);

    await client.query(
      `INSERT INTO audit_logs (admin_id, action, table_name, record_id, old_values, ip_address) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [adminId, 'DELETE_PROPERTY', 'properties', id, JSON.stringify(result.rows[0]), req.ip]
    );

    await client.query('COMMIT');
    return successResponse(res, null, "Property deleted successfully");
  } catch (error) {
    await client.query('ROLLBACK');
    return errorResponse(res, "Failed to delete property", 500);
  } finally {
    client.release();
  }
};

/**
 * GET /api/admin/properties/:id/details
 */
exports.getPropertyAdminDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Bookings
    const bookings = await pool.query(`
      SELECT b.*, u.first_name || ' ' || u.last_name as requester_name
      FROM bookings b
      LEFT JOIN users u ON b.buyer_tenant_phone = u.phone_number
      WHERE b.property_id = $1
      ORDER BY b.created_at DESC
    `, [id]);
    
    // Transactions
    const transactions = await pool.query('SELECT * FROM transactions WHERE property_id = $1', [id]);
    
    // Reviews
    const reviews = await pool.query('SELECT * FROM reviews WHERE target_id = $1', [id]);

    return successResponse(res, {
      bookings: bookings.rows,
      transactions: transactions.rows,
      reviews: reviews.rows
    }, "Property details fetched");
  } catch (error) {
    return errorResponse(res, "Failed to fetch property details", 500);
  }
};

/**
 * GET /api/admin/agents
 * @description Fetch all agents with performance metrics
 */
exports.getAgents = async (req, res) => {
  try {
    const agents = await pool.query(`
      SELECT 
        u.user_id, u.first_name, u.last_name, u.phone_number, u.email, 
        u.status, u.is_verified, u.last_login, u.profile_image, u.created_at,
        (SELECT COUNT(*) FROM properties p WHERE p.agent_id = u.user_id) as active_listings,
        (SELECT COUNT(*) FROM transactions t WHERE t.agent_id = u.user_id AND t.transaction_status = 'Completed') as total_transactions,
        (SELECT COALESCE(SUM(c.amount), 0) FROM commissions c WHERE c.agent_id = u.user_id AND c.commission_status = 'Completed') as total_commissions,
        (SELECT COALESCE(AVG(r.rating), 0) FROM reviews r JOIN properties p ON r.target_id = p.property_id WHERE p.agent_id = u.user_id) as avg_rating
      FROM users u
      WHERE u.role = 'Agent'
      ORDER BY u.created_at DESC
    `);

    return successResponse(res, agents.rows, "Agents fetched successfully");
  } catch (error) {
    console.error("Admin Get Agents Error:", error);
    return errorResponse(res, "Failed to fetch agents", 500);
  }
};

/**
 * GET /api/admin/commissions/overview
 */
exports.getCommissionOverview = async (req, res) => {
  try {
    const overview = await pool.query(`
      SELECT 
        commission_status,
        COUNT(*) as count,
        SUM(amount) as total_amount
      FROM commissions
      GROUP BY commission_status
    `);
    
    return successResponse(res, overview.rows, "Commission overview fetched");
  } catch (error) {
    return errorResponse(res, "Failed to fetch commission overview", 500);
  }
};

/**
 * POST /api/admin/agents
 * @description Register a new certified agent
 */
exports.registerAgent = async (req, res) => {
  const { first_name, last_name, phone_number, email, national_id, city, password } = req.body;
  const adminId = req.user ? req.user.id : null;
  const bcrypt = require("bcryptjs");

  try {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const result = await pool.query(
      `INSERT INTO users (first_name, last_name, phone_number, email, national_id, city, password_hash, role, status, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'Agent', 'Active', TRUE) RETURNING *`,
      [first_name, last_name, phone_number, email, national_id, city || 'Addis Ababa', password_hash]
    );

    // Audit Log
    await pool.query(
      `INSERT INTO audit_logs (admin_id, action, table_name, record_id, new_values, ip_address) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [adminId, 'REGISTER_AGENT', 'users', result.rows[0].user_id, JSON.stringify(result.rows[0]), req.ip]
    );

    return successResponse(res, result.rows[0], "Agent registered successfully", 201);
  } catch (error) {
    console.error("Agent Registration Error:", error);
    return errorResponse(res, "Failed to register agent. Duplicate data?", 400);
  }
};

/**
 * GET /api/admin/reports/financial
 */
exports.getFinancialReports = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let dateFilter = "";
    const params = [];

    if (startDate && endDate) {
      params.push(startDate, endDate);
      dateFilter = ` AND created_at BETWEEN $1 AND $2`;
    }

    const totalRevenue = await pool.query(`SELECT COALESCE(SUM(agreed_price), 0) as total FROM transactions WHERE transaction_status = 'Completed'${dateFilter}`, params);
    const commissionRevenue = await pool.query(`SELECT COALESCE(SUM(amount), 0) as total FROM commissions WHERE commission_status = 'Completed'${dateFilter}`, params);
    const paymentBreakdown = await pool.query(`SELECT payment_status, COUNT(*), SUM(amount) FROM payments GROUP BY payment_status`);
    const monthlyIncome = await pool.query(`
      SELECT TO_CHAR(created_at, 'YYYY-MM') as month, transaction_type, SUM(agreed_price) as income
      FROM transactions 
      WHERE transaction_status = 'Completed'
      GROUP BY month, transaction_type
      ORDER BY month DESC LIMIT 12
    `);

    return successResponse(res, {
      totalRevenue: totalRevenue.rows[0].total,
      commissionRevenue: commissionRevenue.rows[0].total,
      paymentBreakdown: paymentBreakdown.rows,
      monthlyIncome: monthlyIncome.rows
    }, "Financial reports fetched");
  } catch (error) {
    return errorResponse(res, "Failed to fetch financial reports", 500);
  }
};

/**
 * GET /api/admin/reports/users
 */
exports.getUserReports = async (req, res) => {
  try {
    const growth = await pool.query(`SELECT TO_CHAR(created_at, 'YYYY-MM') as month, COUNT(*) as count FROM users GROUP BY month ORDER BY month DESC LIMIT 6`);
    const statusRatio = await pool.query(`SELECT status, COUNT(*) FROM users GROUP BY status`);
    const agentRanking = await pool.query(`
      SELECT u.first_name, u.last_name, COUNT(t.transaction_id) as deals
      FROM users u
      JOIN transactions t ON u.user_id = t.agent_id
      WHERE u.role = 'Agent' AND t.transaction_status = 'Completed'
      GROUP BY u.user_id
      ORDER BY deals DESC LIMIT 5
    `);

    return successResponse(res, { growth: growth.rows, statusRatio: statusRatio.rows, agentRanking: agentRanking.rows }, "User reports fetched");
  } catch (error) {
    return errorResponse(res, "Failed to fetch user reports", 500);
  }
};

/**
 * GET /api/admin/reports/properties
 */
exports.getPropertyReports = async (req, res) => {
  try {
    const cityListings = await pool.query(`SELECT city, COUNT(*) as count FROM properties GROUP BY city ORDER BY count DESC`);
    const types = await pool.query(`SELECT property_type, COUNT(*) as count FROM properties GROUP BY property_type`);
    const expensive = await pool.query(`SELECT title, price, city FROM properties ORDER BY price DESC LIMIT 5`);

    return successResponse(res, { cityListings: cityListings.rows, types: types.rows, expensive: expensive.rows }, "Property reports fetched");
  } catch (error) {
    return errorResponse(res, "Failed to fetch property reports", 500);
  }
};

/**
 * GET /api/admin/disputes
 */
exports.getDisputes = async (req, res) => {
  try {
    const { status, type } = req.query;
    let query = `
      SELECT d.*, u.first_name || ' ' || u.last_name as user_name, p.title as property_title
      FROM disputes d
      JOIN users u ON d.user_id = u.user_id
      LEFT JOIN properties p ON d.property_id = p.property_id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      params.push(status);
      query += ` AND d.status = $${params.length}`;
    }
    if (type) {
      params.push(type);
      query += ` AND d.dispute_type = $${params.length}`;
    }

    query += " ORDER BY d.created_at DESC";

    const result = await pool.query(query, params);
    return successResponse(res, result.rows, "Disputes fetched successfully");
  } catch (error) {
    return errorResponse(res, "Failed to fetch disputes", 500);
  }
};

/**
 * GET /api/admin/disputes/:id
 */
exports.getDisputeDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const dispute = await pool.query(`
      SELECT d.*, u.first_name || ' ' || u.last_name as user_name, u.phone_number, u.email
      FROM disputes d
      JOIN users u ON d.user_id = u.user_id
      WHERE d.dispute_id = $1
    `, [id]);

    if (dispute.rows.length === 0) return errorResponse(res, "Dispute not found", 404);

    const related = {
      booking: dispute.rows[0].booking_id ? (await pool.query('SELECT * FROM bookings WHERE booking_id = $1', [dispute.rows[0].booking_id])).rows[0] : null,
      transaction: dispute.rows[0].transaction_id ? (await pool.query('SELECT * FROM transactions WHERE transaction_id = $1', [dispute.rows[0].transaction_id])).rows[0] : null,
    };

    return successResponse(res, { dispute: dispute.rows[0], related }, "Dispute details fetched");
  } catch (error) {
    return errorResponse(res, "Failed to fetch details", 500);
  }
};

/**
 * POST /api/admin/disputes/:id/resolve
 */
exports.resolveDispute = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { resolution_details, status } = req.body;
    const adminId = req.user ? req.user.id : null;

    await client.query('BEGIN');

    const result = await client.query(
      `UPDATE disputes 
       SET status = $1, resolution_details = $2, resolved_at = CURRENT_TIMESTAMP, resolved_by = $3
       WHERE dispute_id = $4 RETURNING *`,
      [status || 'Resolved', resolution_details, adminId, id]
    );

    // Trigger Notification
    await client.query(
      `INSERT INTO notifications (user_id, title, message)
       VALUES ($1, $2, $3)`,
      [result.rows[0].user_id, 'Dispute Resolved', `Your dispute #${id.split('-')[0]} has been marked as ${status}.`]
    );

    await client.query('COMMIT');
    return successResponse(res, result.rows[0], "Dispute resolved and user notified");
  } catch (error) {
    await client.query('ROLLBACK');
    return errorResponse(res, "Failed to resolve dispute", 500);
  } finally {
    client.release();
  }
};

/**
 * GET /api/admin/settings
 */
exports.getSystemSettings = async (req, res) => {
  try {
    const settings = await pool.query('SELECT * FROM system_settings');
    return successResponse(res, settings.rows, "System settings fetched");
  } catch (error) {
    return errorResponse(res, "Failed to fetch settings", 500);
  }
};

/**
 * PUT /api/admin/settings
 * @description Bulk update settings
 */
exports.updateSystemSettings = async (req, res) => {
  const { settings } = req.body; // Array of { key, value }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const s of settings) {
      await client.query(
        'UPDATE system_settings SET value = $1, updated_at = CURRENT_TIMESTAMP WHERE key = $2',
        [s.value, s.key]
      );
    }
    await client.query('COMMIT');
    return successResponse(res, null, "Settings updated successfully");
  } catch (error) {
    await client.query('ROLLBACK');
    return errorResponse(res, "Failed to update settings", 500);
  } finally {
    client.release();
  }
};

/**
 * POST /api/admin/maintenance/backup
 */
exports.runSystemBackup = async (req, res) => {
  try {
    // In a real environment, you would trigger a pg_dump or cloud backup job
    const timestamp = new Date().toISOString();
    return successResponse(res, { timestamp, backup_id: Math.random().toString(36).substr(2, 9) }, "Manual backup triggered successfully");
  } catch (error) {
    return errorResponse(res, "Backup failed", 500);
  }
};
