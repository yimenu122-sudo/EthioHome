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
const PaymentService = require('./payment_service.model');
const PropertyImage = require('./property_image.model');
const Wishlist = require('./wishlist.model');
const Review = require('./review.model');
const PropertyDocument = require('./property_document.model');
const AuditLog = require('./audit_log.model');
const Dataset = require('./dataset.model');
const DataTokenPackage = require('./data_token_package.model');
const UserDataToken = require('./user_data_token.model');
const DataPurchase = require('./data_purchase.model');
const DataDownloadLog = require('./data_download_log.model');
const SystemSetting = require('./system_setting.model');
const TokenLedger = require('./token_ledger.model');

// ─── User ↔ Property ─────────────────────────────────────────────────────────

// Owner: one user owns many properties
User.hasMany(Property, { foreignKey: 'owner_id', as: 'ownedProperties' });
Property.belongsTo(User, { foreignKey: 'owner_id', as: 'owner' });

// Agent: one agent manages many properties
User.hasMany(Property, { foreignKey: 'agent_id', as: 'assignedProperties' });
Property.belongsTo(User, { foreignKey: 'agent_id', as: 'agent' });

// Land Manager: properties verified by a land manager
Property.belongsTo(User, { foreignKey: 'verified_by', as: 'verifier' });
User.hasMany(Property, { foreignKey: 'verified_by', as: 'verifiedProperties' });

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

// ─── Property ↔ PropertyDocument ──────────────────────────────────────────────
Property.hasMany(PropertyDocument, {
  foreignKey: 'property_id',
  as: 'documents',
  onDelete: 'CASCADE',
});
PropertyDocument.belongsTo(Property, { foreignKey: 'property_id', as: 'property' });

// Document Verifier
PropertyDocument.belongsTo(User, { foreignKey: 'verified_by', as: 'verifier' });
User.hasMany(PropertyDocument, { foreignKey: 'verified_by', as: 'verifiedDocuments' });

// ─── Property ↔ Booking ───────────────────────────────────────────────────────
Property.hasMany(Booking, { foreignKey: 'property_id' });
Booking.belongsTo(Property, { foreignKey: 'property_id' });
Booking.belongsTo(User, { foreignKey: 'agent_id', as: 'agent' });
Booking.belongsTo(User, { foreignKey: 'buyer_renter_id', as: 'buyerRenter' });
User.hasMany(Booking, { foreignKey: 'buyer_renter_id', as: 'bookings' });

// ─── Transaction Relations ────────────────────────────────────────────────────
// Use capitalized aliases consistently — these are what the controllers and frontend expect
Transaction.belongsTo(Property, { foreignKey: 'property_id', as: 'Property' });
Transaction.belongsTo(Property, { foreignKey: 'property_id', as: 'property' });
Transaction.belongsTo(Booking,  { foreignKey: 'booking_id' });
Transaction.belongsTo(User, { foreignKey: 'buyer_renter_id', as: 'buyerRenter' });
Transaction.belongsTo(User, { foreignKey: 'owner_id',        as: 'Owner' });
Transaction.belongsTo(User, { foreignKey: 'owner_id',        as: 'owner' });
Transaction.belongsTo(User, { foreignKey: 'agent_id',        as: 'Agent' });
Transaction.hasMany(Payment,    { foreignKey: 'transaction_id', as: 'Payments' });
Transaction.hasMany(Payment,    { foreignKey: 'transaction_id', as: 'payments' });
Transaction.hasOne(Payment,     { foreignKey: 'transaction_id', as: 'Payment' });
Transaction.hasOne(Payment,     { foreignKey: 'transaction_id', as: 'payment' });
Transaction.hasMany(Commission, { foreignKey: 'transaction_id', as: 'Commissions' });
Transaction.hasOne(Commission,  { foreignKey: 'transaction_id', as: 'Commission' });
Transaction.hasOne(Commission,  { foreignKey: 'transaction_id', as: 'commission' });
Payment.belongsTo(Transaction,  { foreignKey: 'transaction_id', as: 'transaction' });
Payment.belongsTo(Transaction,  { foreignKey: 'transaction_id', as: 'Transaction' });
Commission.belongsTo(Transaction, { foreignKey: 'transaction_id' });

// ─── Payment & PaymentService redesigned associations ──────────────────────────
Payment.belongsTo(User, { foreignKey: 'payer_id', as: 'payer' });
User.hasMany(Payment, { foreignKey: 'payer_id', as: 'madePayments' });

Payment.belongsTo(User, { foreignKey: 'payee_id', as: 'payee' });
User.hasMany(Payment, { foreignKey: 'payee_id', as: 'receivedPayments' });

Payment.belongsTo(User, { foreignKey: 'verified_by', as: 'verifier' });
User.hasMany(Payment, { foreignKey: 'verified_by', as: 'verifiedPayments' });

Payment.belongsTo(PaymentService, { foreignKey: 'payment_service_id', as: 'paymentService' });
PaymentService.hasMany(Payment, { foreignKey: 'payment_service_id', as: 'payments' });

Payment.belongsTo(Property, { foreignKey: 'property_id', as: 'property' });
Property.hasMany(Payment, { foreignKey: 'property_id', as: 'payments' });

Payment.belongsTo(Booking, { foreignKey: 'booking_id', as: 'booking' });
Booking.hasMany(Payment, { foreignKey: 'booking_id', as: 'payments' });

Payment.belongsTo(Commission, { foreignKey: 'commission_id', as: 'commission' });
Commission.hasMany(Payment, { foreignKey: 'commission_id', as: 'payments' });


// ─── Commission User Relations ─────────────────────────────────────────────────
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

// ─── Data Marketplace Relations ──────────────────────────────────────────────
User.hasOne(UserDataToken, { foreignKey: 'user_id', as: 'dataTokens' });
UserDataToken.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(DataPurchase, { foreignKey: 'user_id', as: 'dataPurchases' });
DataPurchase.belongsTo(User, { foreignKey: 'user_id' });
DataPurchase.belongsTo(DataTokenPackage, { foreignKey: 'package_id', as: 'package' });

User.hasMany(DataDownloadLog, { foreignKey: 'user_id', as: 'downloadLogs' });
DataDownloadLog.belongsTo(User, { foreignKey: 'user_id' });
DataDownloadLog.belongsTo(Dataset, { foreignKey: 'dataset_id', as: 'dataset' });
Dataset.hasMany(DataDownloadLog, { foreignKey: 'dataset_id', as: 'downloads' });

User.hasMany(TokenLedger, { foreignKey: 'user_id', as: 'tokenLedger' });
TokenLedger.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = {
  Property,
  Booking,
  Commission,
  Transaction,
  Payment,
  PaymentService,
  User,
  PropertyImage,
  Wishlist,
  Review,
  PropertyDocument,
  AuditLog,
  Dataset,
  DataTokenPackage,
  UserDataToken,
  DataPurchase,
  DataDownloadLog,
  SystemSetting,
  TokenLedger
};
