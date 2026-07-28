const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * @file dataset.model.js
 * @description Sequelize model for Housing Market Datasets
 */
const Dataset = sequelize.define('Dataset', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title_en: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  title_am: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description_en: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  description_am: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  region: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  token_cost: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  record_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  file_path: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  file_format: {
    type: DataTypes.STRING(10),
    defaultValue: 'CSV'
  },
  file_size_kb: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  sample_data: {
    type: DataTypes.JSON,
    allowNull: true
  },
  rating: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 0.00
  },
  download_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  version: {
    type: DataTypes.STRING(20),
    defaultValue: '1.0.0'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'datasets',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Dataset;
