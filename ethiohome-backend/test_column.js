const { sequelize } = require('./src/config/db');
sequelize.query("SELECT negotiated_price FROM bookings LIMIT 1")
  .then((res) => {
    console.log('✅ Success: negotiated_price column accessible');
    console.log(res[0]);
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Error: negotiated_price column NOT accessible');
    console.error(err.message);
    process.exit(1);
  });
