const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Commission = sequelize.define('Commission', {
  commission_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  transaction_id: {
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
    type: DataTypes.UUID,
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  commission_status: {
    type: DataTypes.ENUM('Pending', 'Processing', 'Completed', 'Failed'),
    defaultValue: 'Pending'
  }
}, {
  tableName: 'commissions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = Commission;
