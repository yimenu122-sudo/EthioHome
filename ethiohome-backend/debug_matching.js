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
    const propertyCity = "Addis Ababa";
    console.log(`Searching for Active Agents in: ${propertyCity}`);
    const { rows } = await pool.query("SELECT user_id, first_name, last_name, city, status FROM users WHERE role = 'Agent'");
    console.log("All Agents found:");
    rows.forEach(r => {
      const match = r.city === propertyCity;
      console.log(`- ${r.first_name} ${r.last_name} | City: "${r.city}" | Status: "${r.status}" | Exact Match: ${match}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
check();
