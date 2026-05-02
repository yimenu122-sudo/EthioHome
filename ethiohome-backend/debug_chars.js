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
    console.log(`Property City: "${propertyCity}" (length: ${propertyCity.length})`);
    const { rows } = await pool.query("SELECT user_id, first_name, last_name, city, status FROM users WHERE role = 'Agent'");
    rows.forEach(r => {
      console.log(`Agent City: "${r.city}" (length: ${r.city.length})`);
      if (r.city === propertyCity) {
          console.log("EXACT MATCH!");
      } else {
          console.log("NO MATCH.");
          // Compare char by char
          for(let i=0; i < Math.max(propertyCity.length, r.city.length); i++) {
              console.log(`Char ${i}: property="${propertyCity[i]}" (${propertyCity.charCodeAt(i)}) | agent="${r.city[i]}" (${r.city.charCodeAt(i)})`);
          }
      }
    });
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
check();
