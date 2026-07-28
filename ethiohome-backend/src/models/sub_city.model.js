/**
 * @file sub_city.model.js
 * @description Raw SQL SubCity model mapping to sub_cities table
 */
const { pool } = require("../config/db");

class SubCityModel {
  static async getAll(filters = {}) {
    const { city_id, search, is_active } = filters;
    let query = `SELECT * FROM sub_cities WHERE 1=1`;
    const params = [];

    if (city_id) {
      params.push(city_id);
      query += ` AND city_id = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (name_en ILIKE $${params.length} OR name_am ILIKE $${params.length})`;
    }

    if (is_active !== undefined) {
      params.push(is_active === 'true' || is_active === true);
      query += ` AND is_active = $${params.length}`;
    }

    query += ` ORDER BY name_en ASC`;

    const { rows } = await pool.query(query, params);
    return rows;
  }

  static async findById(id) {
    const { rows } = await pool.query(`SELECT * FROM sub_cities WHERE id = $1`, [id]);
    return rows[0];
  }

  static async findByNameEn(city_id, name_en) {
    const { rows } = await pool.query(`SELECT * FROM sub_cities WHERE city_id = $1 AND name_en = $2`, [city_id, name_en]);
    return rows[0];
  }

  static async getByCityId(city_id) {
    const { rows } = await pool.query(`SELECT * FROM sub_cities WHERE city_id = $1 AND is_active = true ORDER BY name_en ASC`, [city_id]);
    return rows;
  }

  static async create(subCityData) {
    const query = `
      INSERT INTO sub_cities (city_id, name_en, name_am, is_active)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const values = [
      subCityData.city_id,
      subCityData.name_en,
      subCityData.name_am,
      subCityData.is_active !== undefined ? subCityData.is_active : true
    ];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async update(id, subCityData) {
    const query = `
      UPDATE sub_cities
      SET city_id = $1,
          name_en = $2,
          name_am = $3,
          is_active = $4,
          updated_at = NOW()
      WHERE id = $5
      RETURNING *;
    `;
    const values = [
      subCityData.city_id,
      subCityData.name_en,
      subCityData.name_am,
      subCityData.is_active,
      id
    ];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async delete(id) {
    const { rows } = await pool.query(`DELETE FROM sub_cities WHERE id = $1 RETURNING *`, [id]);
    return rows[0];
  }

  static async getAnalytics(id) {
    const query = `
      SELECT 
        COUNT(p.property_id) as total_properties,
        COUNT(CASE WHEN p.listing_type = 'Rent' THEN 1 END) as rent_count,
        COUNT(CASE WHEN p.listing_type = 'Sale' THEN 1 END) as sale_count,
        COALESCE(AVG(p.price) FILTER (WHERE p.listing_type = 'Rent'), 0) as avg_rent_price,
        COALESCE(AVG(p.price) FILTER (WHERE p.listing_type = 'Sale'), 0) as avg_sale_price
      FROM sub_cities sc
      JOIN cities c ON sc.city_id = c.id
      LEFT JOIN properties p ON (sc.name_en = p.sub_city AND c.name_en = p.city)
      WHERE sc.id = $1
      GROUP BY sc.id, c.id;
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0] || {
      total_properties: 0,
      rent_count: 0,
      sale_count: 0,
      avg_rent_price: 0,
      avg_sale_price: 0
    };
  }

  static async getProperties(id, filters = {}) {
    const { limit = 10, offset = 0 } = filters;
    const query = `
      SELECT p.* 
      FROM properties p
      JOIN sub_cities sc ON p.sub_city = sc.name_en
      JOIN cities c ON sc.city_id = c.id
      WHERE sc.id = $1 AND p.city = c.name_en
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3;
    `;
    const { rows } = await pool.query(query, [id, limit, offset]);
    return rows;
  }
}

module.exports = SubCityModel;
