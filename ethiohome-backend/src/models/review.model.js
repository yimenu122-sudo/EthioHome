const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * @file review.model.js
 * @description Sequelize model for Property and User reviews
 */
const Review = sequelize.define('Review', {
  review_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  reviewer_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'user_id',
    }
  },
  target_id: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'Can be property_id or agent_id/owner_id'
  },
  target_type: {
    type: DataTypes.ENUM('Property', 'Agent', 'Owner'),
    allowNull: false,
    defaultValue: 'Property'
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5
    }
  },
  comment: {
    type: DataTypes.TEXT,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'reviews',
  timestamps: false,
  underscored: true,
});

module.exports = Review;
