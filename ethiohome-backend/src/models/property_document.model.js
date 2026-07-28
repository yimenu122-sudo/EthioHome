const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * @file property_document.model.js
 * @description Sequelize model for Property Documents
 */
const PropertyDocument = sequelize.define('PropertyDocument', {
  document_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  property_id: {
    type: DataTypes.UUID,
    allowNull: false
  },

  house_plan_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  uploaded_by: {
    type: DataTypes.UUID,
    allowNull: true
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  verified_by: {
    type: DataTypes.UUID,
    allowNull: true
  },
  verified_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'property_documents',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false // Schema doesn't show updated_at for documents, but database.sql has created_at
});

module.exports = PropertyDocument;
