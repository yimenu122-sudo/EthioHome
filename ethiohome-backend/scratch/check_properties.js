const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: 'c:/expo/final_project/final_project/ethiohome-backend/.env' });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function run() {
  try {
    const { rows: props } = await pool.query(`
      SELECT p.property_id, p.title, p.availability_status, p.owner_id, u.email, p.property_image
      FROM properties p
      JOIN users u ON p.owner_id = u.user_id
      WHERE p.availability_status IN ('Rented', 'Sold')
    `);
    console.log('Rented/Sold Properties with Owners:');
    console.log(JSON.stringify(props, null, 2));

    if (props.length > 0) {
      const firstProp = props[0];
      const token = jwt.sign(
        { id: firstProp.owner_id, role: 'Owner' },
        process.env.JWT_SECRET || 'supersecretkey'
      );
      console.log(`Generated JWT for ${firstProp.email} (ID: ${firstProp.owner_id}):`);
      console.log(token);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
