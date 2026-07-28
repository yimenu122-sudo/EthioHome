const { pool } = require('./src/config/db');
require('dotenv').config();

async function checkLogos() {
  try {
    const res = await pool.query('SELECT name_en, service_code, logo_url FROM payment_services');
    console.log(JSON.stringify(res.rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkLogos();
