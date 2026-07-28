const LandManagerService = require('../services/land-manager.service');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * @file land-manager.controller.js
 * @description Controller for Land Manager module
 */

exports.getProperties = async (req, res) => {
  try {
    const { status, page, limit } = req.query;
    const city = req.user.city;
    const data = await LandManagerService.getProperties(status, parseInt(page) || 1, parseInt(limit) || 10, city);
    return successResponse(res, data, 'Properties fetched successfully');
  } catch (error) {
    return errorResponse(res, error.message, error.statusCode || 500);
  }
};

exports.getPropertyDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const city = req.user.city;
    const property = await LandManagerService.getPropertyDetails(id, city);
    return successResponse(res, property, 'Property details fetched successfully');
  } catch (error) {
    return errorResponse(res, error.message, error.statusCode || 500);
  }
};

exports.verifyProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const verifierId = req.user.id;
    const city = req.user.city;
    const property = await LandManagerService.verifyProperty(id, verifierId, req.ip, city);
    return successResponse(res, property, 'Property verified successfully');
  } catch (error) {
    return errorResponse(res, error.message, error.statusCode || 500);
  }
};

exports.rejectProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const verifierId = req.user.id;
    const city = req.user.city;

    if (!reason) {
      return errorResponse(res, 'Rejection reason is required', 400);
    }

    const property = await LandManagerService.rejectProperty(id, verifierId, reason, req.ip, city);
    return successResponse(res, property, 'Property rejected successfully');
  } catch (error) {
    return errorResponse(res, error.message, error.statusCode || 500);
  }
};

exports.getDocuments = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const city = req.user.city;
    const documents = await LandManagerService.getPropertyDocuments(propertyId, city);
    return successResponse(res, documents, 'Documents fetched successfully');
  } catch (error) {
    return errorResponse(res, error.message, error.statusCode || 500);
  }
};

exports.verifyDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const verifierId = req.user.id;
    const city = req.user.city;
    const doc = await LandManagerService.verifyDocument(id, verifierId, req.ip, city);
    return successResponse(res, doc, 'Document verified successfully');
  } catch (error) {
    return errorResponse(res, error.message, error.statusCode || 500);
  }
};

exports.getHistory = async (req, res) => {
  try {
    const verifierId = req.user.id;
    const history = await LandManagerService.getHistory(verifierId);
    return successResponse(res, history, 'Verification history fetched successfully');
  } catch (error) {
    return errorResponse(res, error.message, error.statusCode || 500);
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const { Property, PropertyDocument } = require('../models/associations');
    const { Op } = require('sequelize');
    
    const city = req.user.city;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = await Property.findAll({
      where: { city },
      attributes: [
        'verification_status',
        [Property.sequelize.fn('COUNT', Property.sequelize.col('property_id')), 'count']
      ],
      group: ['verification_status'],
      raw: true
    });

    const todayStats = await Property.findAll({
      where: {
        city,
        verified_at: { [Op.gte]: today }
      },
      attributes: [
        'verification_status',
        [Property.sequelize.fn('COUNT', Property.sequelize.col('property_id')), 'count']
      ],
      group: ['verification_status'],
      raw: true
    });

    const formattedStats = {
      Pending: 0,
      Under_Review: 0,
      Verified: 0,
      Rejected: 0,
      VerifiedToday: 0,
      RejectedToday: 0,
      FraudAlerts: 0,
      MissingDocuments: 0
    };

    stats.forEach(s => {
      formattedStats[s.verification_status] = parseInt(s.count);
    });

    todayStats.forEach(s => {
      if (s.verification_status === 'Verified') formattedStats.VerifiedToday = parseInt(s.count);
      if (s.verification_status === 'Rejected') formattedStats.RejectedToday = parseInt(s.count);
    });

    // Count properties with missing documents (Pending with 0 documents)
    const missingDocsCount = await Property.count({
      where: {
        city,
        verification_status: 'Pending'
      },
      include: [{
        model: PropertyDocument,
        as: 'documents',
        required: false
      }],
      having: Property.sequelize.literal('count("documents"."document_id") = 0'),
      group: ['Property.property_id']
    });

    formattedStats.MissingDocuments = Array.isArray(missingDocsCount) ? missingDocsCount.length : missingDocsCount;

    // Calculate Rejection Rate
    const totalHandled = formattedStats.Verified + formattedStats.Rejected;
    formattedStats.RejectionRate = totalHandled > 0 
      ? ((formattedStats.Rejected / totalHandled) * 100).toFixed(1) 
      : 0;

    // Calculate Avg Processing Time (in hours)
    const verifiedProperties = await Property.findAll({
      where: {
        city,
        verification_status: 'Verified',
        verified_at: { [Op.ne]: null }
      },
      attributes: ['created_at', 'verified_at'],
      raw: true
    });

    if (verifiedProperties.length > 0) {
      const totalTime = verifiedProperties.reduce((acc, p) => {
        const start = new Date(p.created_at);
        const end = new Date(p.verified_at);
        return acc + (end.getTime() - start.getTime());
      }, 0);
      formattedStats.AvgProcessingTime = (totalTime / verifiedProperties.length / (1000 * 60 * 60)).toFixed(1);
    } else {
      formattedStats.AvgProcessingTime = 0;
    }

    return successResponse(res, formattedStats, 'Dashboard stats fetched successfully');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

exports.getDocumentDetails = async (req, res) => {
  try {
    const { PropertyDocument, User } = require('../models/associations');
    const doc = await PropertyDocument.findByPk(req.params.id, {
      include: [
        { model: User, as: 'uploader', attributes: ['first_name', 'last_name', 'phone_number'] }
      ]
    });
    if (!doc) return errorResponse(res, 'Document not found', 404);
    return successResponse(res, doc, 'Document details fetched successfully');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};
