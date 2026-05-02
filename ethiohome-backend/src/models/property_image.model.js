/**
 * @file property_image.model.js
 * @description Sequelize model for the property_images table (EthioHome)
 * Supports multiple images per property with ordering and primary flag
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const PropertyImage = sequelize.define('PropertyImage', {
  image_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  property_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  image_url: {
    type: DataTypes.TEXT,
    allowNull: false,  // Cloudinary / S3 / Storage URL
  },
  image_public_id: {
    type: DataTypes.TEXT,
    allowNull: true,   // For Cloudinary delete support
  },
  is_primary: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  display_order: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
  uploaded_by: {
    type: DataTypes.UUID,
    allowNull: true,
  },
}, {
  tableName: 'property_images',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = PropertyImage;
