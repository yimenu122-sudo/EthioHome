const { Pool } = require('pg');
require('dotenv').config({ path: 'c:/expo/final_project/final_project/ethiohome-backend/.env' });
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});
async function check() {
  try {
    const { rows } = await pool.query("SELECT user_id, first_name, last_name, role, city, status FROM users WHERE role = 'Agent'");
    console.log(JSON.stringify(rows, null, 2));
    const props = await pool.query("SELECT property_id, title, city FROM properties");
    console.log("Properties:");
    console.log(JSON.stringify(props.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
check();
