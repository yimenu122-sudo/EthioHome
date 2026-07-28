const { pool } = require('../src/config/db');

async function fixSchema() {
  try {
    console.log('🔍 Checking for negotiated_price column in bookings table...');
    
    // Check if column exists
    const checkResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='bookings' AND column_name='negotiated_price';
    `);

    if (checkResult.rows.length === 0) {
      console.log('🚀 Column missing. Adding negotiated_price to bookings table...');
      await pool.query(`
        ALTER TABLE bookings 
        ADD COLUMN negotiated_price NUMERIC(15, 2);
      `);
      console.log('✅ Successfully added negotiated_price column!');
    } else {
      console.log('ℹ️ Column negotiated_price already exists.');
    }

  } catch (error) {
    console.error('❌ Error fixing schema:', error.message);
  } finally {
    process.exit();
  }
}

fixSchema();
