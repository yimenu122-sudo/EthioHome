const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Transaction = sequelize.define('Transaction', {
  transaction_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  property_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  booking_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  owner_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  agent_id: {
    type: DataTypes.UUID
  },
  buyer_renter_id: {
    type: DataTypes.UUID
  },
  transaction_type: {
    type: DataTypes.ENUM('Rent', 'Sale'),
    allowNull: false
  },
  agreed_price: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  contract_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  transaction_status: {
    type: DataTypes.ENUM('Pending', 'Completed', 'Cancelled'),
    defaultValue: 'Pending'
  }
}, {
  tableName: 'transactions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = Transaction;
