const { sequelize } = require('./src/config/db');
sequelize.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'payments'")
  .then((res) => {
    console.log('--- Payments Table Columns ---');
    console.table(res[0]);
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
