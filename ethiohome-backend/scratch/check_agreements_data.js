const { Transaction, Booking, Property, User } = require('../src/models/associations');
const { sequelize } = require('../src/config/db');

async function checkData() {
  try {
    const transactions = await Transaction.findAll({
      include: [
        { model: Property, as: 'property' },
        { model: User, as: 'owner' },
        { model: User, as: 'buyerRenter' }
      ]
    });
    console.log('Total Transactions:', transactions.length);
    transactions.forEach(t => {
      console.log(`TX: ${t.transaction_id}, Status: ${t.transaction_status}, Buyer: ${t.buyer_renter_id}, Type: ${t.transaction_type}`);
    });

    const bookings = await Booking.findAll();
    console.log('Total Bookings:', bookings.length);
    bookings.forEach(b => {
      console.log(`Booking: ${b.booking_id}, Status: ${b.booking_status}, Buyer: ${b.buyer_renter_id}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error checking data:', error);
    process.exit(1);
  }
}

checkData();
