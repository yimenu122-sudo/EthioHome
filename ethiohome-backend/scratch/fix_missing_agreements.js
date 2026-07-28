const { Transaction, Booking, Property } = require('../src/models/associations');
const { sequelize } = require('../src/config/db');

async function fixMissingTransactions() {
  try {
    console.log('--- Starting Agreement Fix Script ---');
    
    // 1. Find all Approved bookings
    const approvedBookings = await Booking.findAll({
      where: { booking_status: 'Approved' }
    });

    console.log(`Found ${approvedBookings.length} Approved bookings.`);

    let fixedCount = 0;
    for (const booking of approvedBookings) {
      // 2. Check if a transaction already exists
      const existingTx = await Transaction.findOne({ where: { booking_id: booking.booking_id } });
      
      if (!existingTx) {
        console.log(`Creating missing transaction for Booking ID: ${booking.booking_id}`);
        
        // Fetch property for price
        const property = await Property.findByPk(booking.property_id);
        
        await Transaction.create({
          property_id: booking.property_id,
          booking_id: booking.booking_id,
          owner_id: booking.owner_id,
          agent_id: booking.agent_id,
          buyer_renter_id: booking.buyer_renter_id,
          transaction_type: booking.listing_type,
          agreed_price: booking.negotiated_price || (property ? property.price : 0),
          contract_date: booking.updated_at || new Date(),
          transaction_status: 'Pending'
        });
        fixedCount++;
      }
    }

    console.log(`--- Finished. Created ${fixedCount} missing transactions. ---`);
    process.exit(0);
  } catch (error) {
    console.error('Error fixing transactions:', error);
    process.exit(1);
  }
}

fixMissingTransactions();
