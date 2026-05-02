/**
 * @file booking.service.js
 * @description Business logic for visit scheduling and transaction flow
 */

const Booking = require('../models/booking.model');
const Property = require('../models/property.model');
const { sequelize } = require('../config/db');

class BookingService {
  async createBooking(userId, data) {
    const property = await Property.findByPk(data.property_id);
    if (!property) throw new Error('Property not found');
    if (property.availability_status !== 'Available') {
      throw new Error('Property is not available for booking');
    }

    return await Booking.create({
      ...data,
      booking_status: 'Pending'
    });
  }

  async approveBooking(bookingId, approverId) {
    const booking = await Booking.findByPk(bookingId);
    if (!booking) throw new Error('Booking not found');
    
    // Authorization check would happen here or in controller
    return await booking.update({ booking_status: 'Approved' });
  }

  async scheduleVisit(bookingId, date) {
    const booking = await Booking.findByPk(bookingId);
    if (!booking) throw new Error('Booking not found');
    return await booking.update({ visit_date: date });
  }

  /**
   * Confirms transaction and updates property status
   */
  async confirmTransaction(bookingId) {
    const transaction = await sequelize.transaction();
    try {
      const booking = await Booking.findByPk(bookingId, { transaction });
      if (!booking) throw new Error('Booking not found');

      const property = await Property.findByPk(booking.property_id, { transaction });
      
      const newStatus = property.listing_type === 'Rent' ? 'Rented' : 'Sold';
      
      await property.update({ availability_status: newStatus }, { transaction });
      
      // Update other bookings for this property to Cancelled?
      await Booking.update(
        { booking_status: 'Cancelled' },
        { 
          where: { 
            property_id: property.property_id,
            booking_id: { [require('sequelize').Op.ne]: bookingId },
            booking_status: 'Pending' 
          },
          transaction 
        }
      );

      await transaction.commit();
      return { booking, property };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

module.exports = new BookingService();
