const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * @file data_purchase.model.js
 * @description Sequelize model for Data Marketplace purchases
 */
const DataPurchase = sequelize.define('DataPurchase', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  package_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING(10),
    defaultValue: 'ETB'
  },
  payment_method: {
    type: DataTypes.STRING(50)
  },
  payment_status: {
    type: DataTypes.STRING(20),
    defaultValue: 'pending'
  },
  transaction_reference: {
    type: DataTypes.STRING(100),
    unique: true
  }
}, {
  tableName: 'data_purchases',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = DataPurchase;
