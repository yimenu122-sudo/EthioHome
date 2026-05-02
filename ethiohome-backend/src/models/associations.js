/**
 * @file associations.js
 * @description Sequelize model associations for EthioHome
 * Includes PropertyImage multi-image support
 */

const Property = require('./property.model');
const Booking = require('./booking.model');
const Commission = require('./commission.model');
const User = require('./user.sequelize.js');
const Transaction = require('./transaction.model');
const Payment = require('./payment.model');
const PropertyImage = require('./property_image.model');
const Wishlist = require('./wishlist.model');
const Review = require('./review.model');

// ─── User ↔ Property ─────────────────────────────────────────────────────────

// Owner: one user owns many properties
User.hasMany(Property, { foreignKey: 'owner_id', as: 'ownedProperties' });
Property.belongsTo(User, { foreignKey: 'owner_id', as: 'owner' });

// Agent: one agent manages many properties
User.hasMany(Property, { foreignKey: 'agent_id', as: 'assignedProperties' });
Property.belongsTo(User, { foreignKey: 'agent_id', as: 'agent' });

// ─── Property ↔ PropertyImage ─────────────────────────────────────────────────

// One property can have many images
Property.hasMany(PropertyImage, {
  foreignKey: 'property_id',
  as: 'images',
  onDelete: 'CASCADE',
});
PropertyImage.belongsTo(Property, { foreignKey: 'property_id', as: 'property' });

// Image uploader (user who uploaded the image)
User.hasMany(PropertyImage, { foreignKey: 'uploaded_by', as: 'uploadedImages' });
PropertyImage.belongsTo(User, { foreignKey: 'uploaded_by', as: 'uploader' });

// ─── Property ↔ Booking ───────────────────────────────────────────────────────
Property.hasMany(Booking, { foreignKey: 'property_id' });
Booking.belongsTo(Property, { foreignKey: 'property_id' });
Booking.belongsTo(User, { foreignKey: 'buyer_renter_id', as: 'buyerRenter' });
User.hasMany(Booking, { foreignKey: 'buyer_renter_id', as: 'bookings' });

// ─── Transaction Relations ────────────────────────────────────────────────────
Transaction.belongsTo(Property, { foreignKey: 'property_id' });
Transaction.belongsTo(Booking, { foreignKey: 'booking_id' });
Transaction.hasMany(Payment, { foreignKey: 'transaction_id' });
Payment.belongsTo(Transaction, { foreignKey: 'transaction_id' });

// ─── Commission Relations ─────────────────────────────────────────────────────
Commission.belongsTo(Transaction, { foreignKey: 'transaction_id' });
Transaction.hasOne(Commission, { foreignKey: 'transaction_id' });
Commission.belongsTo(User, { foreignKey: 'agent_id', as: 'agent' });
Commission.belongsTo(User, { foreignKey: 'owner_id', as: 'owner' });

// ─── Wishlist Relations ───────────────────────────────────────────────────────
User.hasMany(Wishlist, { foreignKey: 'user_id', as: 'wishlist' });
Wishlist.belongsTo(User, { foreignKey: 'user_id' });
Property.hasMany(Wishlist, { foreignKey: 'property_id' });
Wishlist.belongsTo(Property, { foreignKey: 'property_id', as: 'property' });

// ─── Review Relations ─────────────────────────────────────────────────────────
Review.belongsTo(User, { foreignKey: 'reviewer_id', as: 'reviewer' });
Review.belongsTo(Property, { foreignKey: 'target_id', as: 'property' });
Property.hasMany(Review, { foreignKey: 'target_id', as: 'reviews' });
User.hasMany(Review, { foreignKey: 'reviewer_id', as: 'myReviews' });

module.exports = {
  Property,
  Booking,
  Commission,
  Transaction,
  Payment,
  User,
  PropertyImage,
  Wishlist,
  Review
};
