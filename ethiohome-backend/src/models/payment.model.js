const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * @file payment.model.js
 * @description Sequelize model for Payments (Redesigned based on owners, buyers, and renters)
 */
const Payment = sequelize.define('Payment', {
  payment_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  transaction_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  property_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  booking_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  commission_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  payer_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  payee_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  payment_service_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  payment_purpose: {
    type: DataTypes.ENUM('Booking_Fee', 'Guarantee_Deposit', 'Property_Payment', 'Commission_Payment', 'Agent_Commission_Payout', 'Token_Purchase'),
    allowNull: false
  },
  payment_type: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING(10),
    defaultValue: 'ETB'
  },
  receipt_image_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  payment_status: {
    type: DataTypes.ENUM('Pending', 'Processing', 'Completed', 'Failed'),
    defaultValue: 'Pending',
    allowNull: false
  },
  verified_by: {
    type: DataTypes.UUID,
    allowNull: true
  },
  verified_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  rejection_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'payments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Payment;
