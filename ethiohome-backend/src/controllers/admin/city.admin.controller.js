/**
 * @file city.admin.controller.js
 * @description Controller for city management (Admin only)
 */
const CityModel = require("../../models/city.model");
const { successResponse, errorResponse } = require("../../utils/response");
const { pool } = require("../../config/db");

/**
 * GET /api/v1/admin/cities
 */
exports.getAllCities = async (req, res) => {
  try {
    const filters = req.query;
    const cities = await CityModel.getAll(filters);
    return successResponse(res, cities, "Cities fetched successfully");
  } catch (error) {
    console.error("Get All Cities Error:", error);
    return errorResponse(res, "Failed to fetch cities", 500);
  }
};

/**
 * POST /api/v1/admin/cities
 */
exports.createCity = async (req, res) => {
  const client = await pool.connect();
  try {
    const { name_en, name_am, region, latitude, longitude, is_active } = req.body;
    const adminId = req.user ? req.user.user_id : null;

    // Check if city already exists
    const existingCity = await CityModel.findByNameEn(name_en);
    if (existingCity) {
      return errorResponse(res, "City with this English name already exists", 400);
    }

    await client.query('BEGIN');

    const newCity = await CityModel.create({
      name_en,
      name_am,
      region,
      latitude,
      longitude,
      is_active
    });

    // Audit Log
    await client.query(
      `INSERT INTO audit_logs (admin_id, action, table_name, record_id, new_values, ip_address) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [adminId, 'CREATE_CITY', 'cities', newCity.id, JSON.stringify(newCity), req.ip]
    );

    await client.query('COMMIT');
    return successResponse(res, newCity, "City created successfully", 201);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Create City Error:", error);
    return errorResponse(res, "Failed to create city", 500);
  } finally {
    client.release();
  }
};

/**
 * PUT /api/v1/admin/cities/:id
 */
exports.updateCity = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { name_en, name_am, region, latitude, longitude, is_active } = req.body;
    const adminId = req.user ? req.user.user_id : null;

    const oldCity = await CityModel.findById(id);
    if (!oldCity) {
      return errorResponse(res, "City not found", 404);
    }

    // Check name uniqueness if changed
    if (name_en !== oldCity.name_en) {
      const existingCity = await CityModel.findByNameEn(name_en);
      if (existingCity) {
        return errorResponse(res, "City with this English name already exists", 400);
      }
    }

    await client.query('BEGIN');

    const updatedCity = await CityModel.update(id, {
      name_en,
      name_am,
      region,
      latitude,
      longitude,
      is_active
    });

    // Audit Log
    await client.query(
      `INSERT INTO audit_logs (admin_id, action, table_name, record_id, old_values, new_values, ip_address) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [adminId, 'UPDATE_CITY', 'cities', id, JSON.stringify(oldCity), JSON.stringify(updatedCity), req.ip]
    );

    await client.query('COMMIT');
    return successResponse(res, updatedCity, "City updated successfully");
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Update City Error:", error);
    return errorResponse(res, "Failed to update city", 500);
  } finally {
    client.release();
  }
};

/**
 * DELETE /api/v1/admin/cities/:id
 */
exports.deleteCity = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const adminId = req.user ? req.user.user_id : null;

    const oldCity = await CityModel.findById(id);
    if (!oldCity) {
      return errorResponse(res, "City not found", 404);
    }

    await client.query('BEGIN');

    await CityModel.delete(id);

    // Audit Log
    await client.query(
      `INSERT INTO audit_logs (admin_id, action, table_name, record_id, old_values, ip_address) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [adminId, 'DELETE_CITY', 'cities', id, JSON.stringify(oldCity), req.ip]
    );

    await client.query('COMMIT');
    return successResponse(res, null, "City deleted successfully");
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Delete City Error:", error);
    return errorResponse(res, "Failed to delete city", 500);
  } finally {
    client.release();
  }
};

/**
 * PATCH /api/v1/admin/cities/:id/toggle
 */
exports.toggleCityActive = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const adminId = req.user ? req.user.user_id : null;

    const oldCity = await CityModel.findById(id);
    if (!oldCity) {
      return errorResponse(res, "City not found", 404);
    }

    await client.query('BEGIN');

    const updatedCity = await CityModel.toggleActive(id);

    // Audit Log
    await client.query(
      `INSERT INTO audit_logs (admin_id, action, table_name, record_id, old_values, new_values, ip_address) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [adminId, 'TOGGLE_CITY_ACTIVE', 'cities', id, JSON.stringify({ is_active: oldCity.is_active }), JSON.stringify({ is_active: updatedCity.is_active }), req.ip]
    );

    await client.query('COMMIT');
    return successResponse(res, updatedCity, "City status toggled successfully");
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Toggle City Active Error:", error);
    return errorResponse(res, "Failed to toggle city status", 500);
  } finally {
    client.release();
  }
};

/**
 * POST /api/v1/admin/cities/bulk
 */
exports.bulkCreateCities = async (req, res) => {
  const client = await pool.connect();
  try {
    const { cities } = req.body; // Array of city objects
    const adminId = req.user ? req.user.user_id : null;

    if (!Array.isArray(cities) || cities.length === 0) {
      return errorResponse(res, "Invalid data. Expected a non-empty array of cities", 400);
    }

    const createdCities = await CityModel.bulkCreate(cities);

    // Audit Log for bulk operation
    await client.query(
      `INSERT INTO audit_logs (admin_id, action, table_name, record_id, new_values, ip_address) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [adminId, 'BULK_CREATE_CITIES', 'cities', null, JSON.stringify({ count: createdCities.length }), req.ip]
    );

    return successResponse(res, { count: createdCities.length, cities: createdCities }, `${createdCities.length} cities imported successfully`);
  } catch (error) {
    console.error("Bulk Create Cities Error:", error);
    return errorResponse(res, "Failed to import cities in bulk", 500);
  } finally {
    client.release();
  }
};
