const { Pool } = require('pg');
require('dotenv').config({ path: 'c:/expo/final_project/final_project/ethiohome-backend/.env' });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function checkUsers() {
  try {
    const { rows } = await pool.query('SELECT user_id, email, phone_number, role, is_verified FROM users');
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

checkUsers();
