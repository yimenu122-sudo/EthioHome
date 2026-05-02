const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

async function fixSchema() {
  try {
    console.log('Attempting to make national_id nullable...');
    await pool.query('ALTER TABLE users ALTER COLUMN national_id DROP NOT NULL;');
    console.log('Successfully made national_id nullable.');
  } catch (err) {
    console.error('Error altering table:', err.message);
  } finally {
    await pool.end();
  }
}

fixSchema();
