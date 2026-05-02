const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * @file system_setting.model.js
 * @description Sequelize model for system-wide configurations
 */
const SystemSetting = sequelize.define('SystemSetting', {
  setting_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  key: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  value: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'system_settings',
  timestamps: true,
  createdAt: false,
  updatedAt: 'updated_at'
});

module.exports = SystemSetting;
