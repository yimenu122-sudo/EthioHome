const { pool } = require('../src/config/db');

async function migrate() {
  try {
    console.log('Adding provider columns...');
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS provider VARCHAR(50)");
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS provider_id VARCHAR(255)");
    console.log('Done!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

migrate();
