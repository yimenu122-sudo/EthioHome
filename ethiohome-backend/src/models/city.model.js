/**
 * @file city.model.js
 * @description Raw SQL City model mapping to cities table
 */
const { pool } = require("../config/db");

class CityModel {
  static async getAll(filters = {}) {
    const { search, region, is_active } = filters;
    let query = `SELECT * FROM cities WHERE 1=1`;
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (name_en ILIKE $${params.length} OR name_am ILIKE $${params.length})`;
    }

    if (region) {
      params.push(region);
      query += ` AND region = $${params.length}`;
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
    const { rows } = await pool.query(`SELECT * FROM cities WHERE id = $1`, [id]);
    return rows[0];
  }

  static async findByNameEn(name_en) {
    const { rows } = await pool.query(`SELECT * FROM cities WHERE name_en = $1`, [name_en]);
    return rows[0];
  }

  static async create(cityData) {
    const query = `
      INSERT INTO cities (name_en, name_am, region, latitude, longitude, is_active)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const values = [
      cityData.name_en,
      cityData.name_am,
      cityData.region,
      cityData.latitude,
      cityData.longitude,
      cityData.is_active !== undefined ? cityData.is_active : true
    ];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async update(id, cityData) {
    const query = `
      UPDATE cities
      SET name_en = $1,
          name_am = $2,
          region = $3,
          latitude = $4,
          longitude = $5,
          is_active = $6,
          updated_at = NOW()
      WHERE id = $7
      RETURNING *;
    `;
    const values = [
      cityData.name_en,
      cityData.name_am,
      cityData.region,
      cityData.latitude,
      cityData.longitude,
      cityData.is_active,
      id
    ];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async delete(id) {
    const { rows } = await pool.query(`DELETE FROM cities WHERE id = $1 RETURNING *`, [id]);
    return rows[0];
  }

  static async bulkCreate(citiesData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const results = [];
      for (const city of citiesData) {
        const query = `
          INSERT INTO cities (name_en, name_am, region, latitude, longitude, is_active)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (name_en) DO NOTHING
          RETURNING *;
        `;
        const values = [
          city.name_en,
          city.name_am,
          city.region,
          city.latitude,
          city.longitude,
          city.is_active !== undefined ? city.is_active : true
        ];
        const { rows } = await client.query(query, values);
        if (rows[0]) results.push(rows[0]);
      }
      await client.query('COMMIT');
      return results;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = CityModel;
