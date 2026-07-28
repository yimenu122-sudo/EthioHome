const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * @file token_ledger.model.js
 * @description Sequelize model for Auditing User Token Balance changes (credits/debits)
 */
const TokenLedger = sequelize.define('TokenLedger', {
  ledger_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  transaction_type: {
    type: DataTypes.ENUM('Purchase', 'Bonus', 'Spend', 'Refund', 'Expiration'),
    allowNull: false
  },
  amount: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  balance_after: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  reference_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  description_en: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  description_am: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'token_ledger',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = TokenLedger;
