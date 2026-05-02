const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * @file user.sequelize.js
 * @description Sequelize version of User model for ORM associations
 */
const UserSeq = sequelize.define('User', {
  user_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  first_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  last_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  phone_number: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING(50),
    allowNull: true,
    unique: true
  },
  national_id: {
    type: DataTypes.STRING(12),
    allowNull: true
  },
  city: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('Admin', 'Agent', 'Owner', 'Renter', 'Buyer'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Active', 'Inactive'),
    defaultValue: 'Pending'
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  preferred_language: {
    type: DataTypes.ENUM('English', 'Amharic'),
    defaultValue: 'English'
  },
  password_hash: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  profile_image: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = UserSeq;
