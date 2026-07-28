const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * @file payment_service.model.js
 * @description Sequelize model for Payment Services
 */
const PaymentService = sequelize.define('PaymentService', {
  service_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name_en: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  name_am: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  service_code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  payment_type: {
    type: DataTypes.ENUM('Bank', 'Mobile Money', 'Platform Gateway', 'Cash'),
    allowNull: false
  },
  account_number: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  account_holder_name: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  logo_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  instructions_en: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  instructions_am: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'payment_services',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = PaymentService;
