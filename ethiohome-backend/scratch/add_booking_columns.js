const { sequelize } = require('../src/config/db');

async function fix() {
  try {
    console.log('--- Migration: Adding missing columns to bookings table ---');
    await sequelize.query(`
      ALTER TABLE bookings 
      ADD COLUMN IF NOT EXISTS buyer_tenant_first_name VARCHAR(100),
      ADD COLUMN IF NOT EXISTS buyer_tenant_last_name VARCHAR(100),
      ADD COLUMN IF NOT EXISTS buyer_tenant_phone VARCHAR(20),
      ADD COLUMN IF NOT EXISTS buyer_tenant_email VARCHAR(100),
      ADD COLUMN IF NOT EXISTS buyer_tenant_role VARCHAR(20);
    `);
    console.log('✅ Columns added to bookings table successfully.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to add columns:', err);
    process.exit(1);
  }
}

fix();
