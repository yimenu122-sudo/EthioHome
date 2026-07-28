const { sequelize } = require('./src/config/db');
sequelize.query("ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_agent TEXT;")
  .then(() => {
    console.log('Successfully added user_agent column to audit_logs');
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
