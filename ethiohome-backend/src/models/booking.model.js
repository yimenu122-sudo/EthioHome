const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const { getEthiopianDateObject } = require('../utils/ethiopianCalendar');

/**
 * @file booking.model.js
 * @description Sequelize model for Property Visit Bookings
 */
const Booking = sequelize.define('Booking', {
  booking_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  owner_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  agent_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  buyer_renter_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  buyer_tenant_first_name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  buyer_tenant_last_name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  buyer_tenant_phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  buyer_tenant_email: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  buyer_tenant_role: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  property_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  listing_type: {
    type: DataTypes.ENUM('Rent', 'Sale'),
    allowNull: false
  },
  visit_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  booking_status: {
    type: DataTypes.ENUM('Pending', 'Owner_Pending', 'Negotiating', 'Approved', 'Cancelled', 'Completed'),
    defaultValue: 'Pending'
  },
  negotiated_price: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true
  },
  visit_date_ec: {
    type: DataTypes.VIRTUAL,
    get() {
      const visitDate = this.getDataValue('visit_date');
      if (!visitDate) return null;
      return getEthiopianDateObject(visitDate);
    }
  }
}, {
  tableName: 'bookings',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = Booking;
