const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * @file data_download_log.model.js
 * @description Sequelize model for logging dataset downloads
 */
const DataDownloadLog = sequelize.define('DataDownloadLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  dataset_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  tokens_spent: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'data_download_logs',
  timestamps: true,
  createdAt: 'downloaded_at',
  updatedAt: false
});

module.exports = DataDownloadLog;
