const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * @file user_data_token.model.js
 * @description Sequelize model for tracking User Token Balance
 */
const UserDataToken = sequelize.define('UserDataToken', {
  user_id: {
    type: DataTypes.UUID,
    primaryKey: true,
    allowNull: false
  },
  balance: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  bonus_balance: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  total_spent: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'user_data_tokens',
  timestamps: true,
  createdAt: false,
  updatedAt: 'updated_at'
});

module.exports = UserDataToken;
