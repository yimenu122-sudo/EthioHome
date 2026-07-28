const { Property, PropertyDocument, User, AuditLog, PropertyImage } = require('../models/associations');
const { Op } = require('sequelize');
const AppError = require('../utils/AppError');

/**
 * @file land-manager.service.js
 * @description Business logic for Land Manager operations
 */

class LandManagerService {
  /**
   * Fetch properties based on verification status
   */
  static async getProperties(status, page = 1, limit = 10, city) {
    const offset = (page - 1) * limit;
    const where = {};
    if (status) where.verification_status = status;
    if (city) where.city = city;

    const { count, rows: properties } = await Property.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      include: [
        { model: User, as: 'owner', attributes: ['first_name', 'last_name', 'phone_number'] },
        { model: PropertyImage, as: 'images', limit: 1 }
      ]
    });

    return {
      properties,
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page
      }
    };
  }

  /**
   * Get full property details for review
   */
  static async getPropertyDetails(propertyId, city) {
    const where = { property_id: propertyId };
    if (city) where.city = city;

    const property = await Property.findOne({
      where,
      include: [
        { model: User, as: 'owner', attributes: ['first_name', 'last_name', 'phone_number', 'email'] },
        { model: User, as: 'agent', attributes: ['first_name', 'last_name', 'phone_number'] },
        { model: PropertyImage, as: 'images' },
        { model: PropertyDocument, as: 'documents' }
      ]
    });

    if (!property) throw new AppError('Property not found', 404);
    return property;
  }

  /**
   * Verify a property
   */
  static async verifyProperty(propertyId, verifierId, ipAddress, city) {
    const where = { property_id: propertyId };
    if (city) where.city = city;
    
    const property = await Property.findOne({ where });
    if (!property) throw new AppError('Property not found in your assigned city', 404);

    const oldValues = { ...property.toJSON() };

    await property.update({
      verification_status: 'Verified',
      availability_status: 'Available',
      verified_by: verifierId,
      verified_at: new Date(),
      rejection_reason: null
    });

    // Create Audit Log
    await AuditLog.create({
      admin_id: verifierId,
      action: 'VERIFY_PROPERTY',
      table_name: 'properties',
      record_id: propertyId,
      old_values: oldValues,
      new_values: property.toJSON(),
      ip_address: ipAddress
    });

    return property;
  }

  /**
   * Reject a property
   */
  static async rejectProperty(propertyId, verifierId, reason, ipAddress, city) {
    const where = { property_id: propertyId };
    if (city) where.city = city;

    const property = await Property.findOne({ where });
    if (!property) throw new AppError('Property not found in your assigned city', 404);

    const oldValues = { ...property.toJSON() };

    await property.update({
      verification_status: 'Rejected',
      availability_status: 'Unavailable',
      rejection_reason: reason,
      verified_by: verifierId,
      verified_at: new Date()
    });

    // Create Audit Log
    await AuditLog.create({
      admin_id: verifierId,
      action: 'REJECT_PROPERTY',
      table_name: 'properties',
      record_id: propertyId,
      old_values: oldValues,
      new_values: property.toJSON(),
      ip_address: ipAddress
    });

    return property;
  }

  /**
   * Get documents for a property
   */
  static async getPropertyDocuments(propertyId, city) {
    const where = { property_id: propertyId };
    if (city) where.city = city;

    const property = await Property.findOne({ where });
    if (!property) throw new AppError('Access denied for this property', 403);

    return await PropertyDocument.findAll({
      where: { property_id: propertyId },
      include: [{ model: User, as: 'verifier', attributes: ['first_name', 'last_name'] }]
    });
  }

  /**
   * Verify a specific document
   */
  static async verifyDocument(documentId, verifierId, ipAddress, city) {
    const doc = await PropertyDocument.findByPk(documentId, {
      include: [{ model: Property, as: 'property' }]
    });
    if (!doc) throw new AppError('Document not found', 404);
    
    if (city && doc.property && doc.property.city !== city) {
      throw new AppError('Access denied: Property belongs to another city', 403);
    }

    const oldValues = { ...doc.toJSON() };

    await doc.update({
      is_verified: true,
      verified_by: verifierId,
      verified_at: new Date()
    });

    // Audit Log
    await AuditLog.create({
      admin_id: verifierId,
      action: 'VERIFY_DOCUMENT',
      table_name: 'property_documents',
      record_id: documentId,
      old_values: oldValues,
      new_values: doc.toJSON(),
      ip_address: ipAddress
    });

    return doc;
  }

  /**
   * Get verification history (Audit Logs)
   */
  static async getHistory(verifierId) {
    return await AuditLog.findAll({
      where: {
        admin_id: verifierId,
        action: { [Op.in]: ['VERIFY_PROPERTY', 'REJECT_PROPERTY', 'VERIFY_DOCUMENT'] }
      },
      order: [['created_at', 'DESC']],
      limit: 50
    });
  }
}

module.exports = LandManagerService;
