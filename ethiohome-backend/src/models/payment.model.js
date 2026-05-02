const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * @file payment.model.js
 * @description Sequelize model for Payments
 */
const Payment = sequelize.define('Payment', {
  payment_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  transaction_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  payment_method: {
    type: DataTypes.ENUM('Bank', 'Mobile Money', 'Tele Birr', 'Cash'),
    allowNull: false
  },
  payment_status: {
    type: DataTypes.ENUM('Pending', 'Processing', 'Completed', 'Failed'),
    defaultValue: 'Pending'
  },
  payment_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'payments',
  timestamps: false // payment_date is used instead of createdAt/updatedAt
});

module.exports = Payment;
