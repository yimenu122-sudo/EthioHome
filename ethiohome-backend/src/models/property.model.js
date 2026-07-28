const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * @file property.model.js
 * @description Sequelize model for Property listing
 */
const Property = sequelize.define('Property', {
  property_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  owner_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  agent_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  title: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  city: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  sub_city: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  woreda: {
    type: DataTypes.STRING(50)
  },
  kebele: {
    type: DataTypes.STRING(50)
  },
  house_number: {
    type: DataTypes.STRING(50)
  },
  specific_location: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  property_type: {
    type: DataTypes.ENUM('House', 'Apartment', 'Villa', 'Studio', 'Commercial', 'Office', 'Shop', 'Land', 'Other'),
    allowNull: false
  },
  listing_type: {
    type: DataTypes.ENUM('Rent', 'Sale'),
    allowNull: false
  },
  property_image: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  number_of_bedrooms: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  bedroom_area_size: {
    type: DataTypes.DECIMAL(10, 2)
  },
  number_of_bathrooms: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  bathroom_area_size: {
    type: DataTypes.DECIMAL(10, 2)
  },
  number_of_living_rooms: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  living_room_area_size: {
    type: DataTypes.DECIMAL(10, 2)
  },
  number_of_kitchens: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  kitchen_area_size: {
    type: DataTypes.DECIMAL(10, 2)
  },
  number_of_floors: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  area_size: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  availability_status: {
    type: DataTypes.ENUM('Available', 'Rented', 'Sold', 'Unavailable'),
    defaultValue: 'Unavailable'
  },
  verification_status: {
    type: DataTypes.ENUM('Pending', 'Under_Review', 'Verified', 'Rejected'),
    defaultValue: 'Pending'
  },
  verified_by: {
    type: DataTypes.UUID,
    allowNull: true
  },
  verified_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  rejection_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'properties',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Property;
