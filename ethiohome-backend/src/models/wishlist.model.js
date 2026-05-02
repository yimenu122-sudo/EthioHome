const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Wishlist = sequelize.define('Wishlist', {
  wishlist_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'user_id',
    }
  },
  property_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'properties',
      key: 'property_id',
    }
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'wishlists',
  timestamps: false,
  underscored: true,
});

module.exports = Wishlist;
