const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * @file data_token_package.model.js
 * @description Sequelize model for Data Token Packages
 */
const DataTokenPackage = sequelize.define('DataTokenPackage', {
  id: {
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
  token_amount: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  bonus_amount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING(10),
    defaultValue: 'ETB'
  },
  description_en: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  description_am: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  badge_color: {
    type: DataTypes.STRING(20),
    defaultValue: '#3B82F6'
  },
  popular: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'data_token_packages',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = DataTokenPackage;
