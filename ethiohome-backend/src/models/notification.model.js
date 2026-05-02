const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Notification = sequelize.define('Notification', {
  notification_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  booking_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  read_at: {
    type: DataTypes.DATE
  },
  is_sent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  sent_at: {
    type: DataTypes.DATE
  }
}, {
  tableName: 'notifications',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = Notification;
