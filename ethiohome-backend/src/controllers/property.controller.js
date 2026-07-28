/**
 * @file property.controller.js
 * @description Core business logic for property management in EthioHome
 */

const Property = require('../models/property.model');
const { successResponse, errorResponse } = require('../utils/response');
const { Op } = require('sequelize');

/**
 * List properties with advanced filtering
 */
exports.getAllProperties = async (req, res) => {
  try {
    const { 
      city, 
      type, 
      minPrice, 
      maxPrice, 
      bedrooms, 
      listing_type,
      page = 1,
      limit = 10 
    } = req.query;

    const where = { 
      availability_status: 'Available',
      verification_status: 'Verified'
    };

    if (city) {
      where.city = city;
    }
    if (listing_type) where.listing_type = listing_type;
    if (type) where.property_type = type;
    
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Op.gte] = parseFloat(minPrice);
      if (maxPrice) where.price[Op.lte] = parseFloat(maxPrice);
    }

    if (bedrooms) where.number_of_bedrooms = parseInt(bedrooms);

    const offset = (page - 1) * limit;

    const { count, rows } = await Property.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    return successResponse(res, {
      total: count,
      pages: Math.ceil(count / limit),
      currentPage: page,
      properties: rows
    }, 'Properties fetched successfully');
  } catch (error) {
    console.error('Fetch Properties Error:', error);
    return errorResponse(res, 'Failed to fetch properties', 500);
  }
};

/**
 * Search properties with exhaustive filters for buyers
 */
exports.searchProperties = async (req, res) => {
  try {
    const { 
      city, 
      sub_city,
      type, 
      minPrice, 
      maxPrice, 
      bedrooms, 
      minArea,
      maxArea,
      query, // keyword search
      page = 1,
      limit = 10 
    } = req.query;

    const where = { 
      availability_status: 'Available',
      verification_status: 'Verified',
      listing_type: 'Sale' // Buyers module focuses on Sale properties
    };

    if (city) {
      where.city = city;
    }
    if (sub_city) {
      where.sub_city = { [Op.iLike]: `%${sub_city}%` };
    }
    if (type) where.property_type = type;
    
    // Price Filter
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Op.gte] = parseFloat(minPrice);
      if (maxPrice) where.price[Op.lte] = parseFloat(maxPrice);
    }

    // Bedrooms Filter
    if (bedrooms) {
      if (bedrooms === '5+') {
        where.number_of_bedrooms = { [Op.gte]: 5 };
      } else {
        where.number_of_bedrooms = parseInt(bedrooms);
      }
    }

    // Area Size Filter
    if (minArea || maxArea) {
      where.area_size = {};
      if (minArea) where.area_size[Op.gte] = parseFloat(minArea);
      if (maxArea) where.area_size[Op.lte] = parseFloat(maxArea);
    }

    // Search Query (Title or Description)
    if (query) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${query}%` } },
        { description: { [Op.iLike]: `%${query}%` } }
      ];
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Property.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    return successResponse(res, {
      total: count,
      pages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      properties: rows
    }, 'Search results fetched successfully');
  } catch (error) {
    console.error('Search Properties Error:', error);
    return errorResponse(res, 'Failed to search properties', 500);
  }
};

/**
 * Get single property details
 */
exports.getPropertyById = async (req, res) => {
  try {
    const { User, PropertyImage } = require('../models/associations');
    const property = await Property.findOne({
      where: {
        property_id: req.params.id,
        availability_status: 'Available',
        verification_status: 'Verified'
      },
      include: [
        { 
          model: User, 
          as: 'owner', 
          attributes: ['first_name', 'last_name', 'phone_number', 'profile_image'] 
        },
        { 
          model: User, 
          as: 'agent', 
          attributes: ['first_name', 'last_name', 'phone_number', 'profile_image'] 
        },
        {
          model: PropertyImage,
          as: 'images',
          attributes: ['image_id', 'image_url', 'is_primary']
        }
      ]
    });

    if (!property) return errorResponse(res, 'Property not found', 404);
    return successResponse(res, property, 'Property detail fetched successfully');
  } catch (error) {
    console.error('Get Property Error:', error);
    return errorResponse(res, 'Failed to fetch property details', 500);
  }
};

/**
 * Create new property listing
 */
exports.createProperty = async (req, res) => {
  try {
    const propertyData = {
      ...req.body,
      owner_id: req.user.id
    };

    const property = await Property.create(propertyData);
    return successResponse(res, property, 'Property listing created', 201);
  } catch (error) {
    return errorResponse(res, 'Failed to create listing', 500, error.message);
  }
};

/**
 * Update property listing
 */
exports.updateProperty = async (req, res) => {
  try {
    const property = await Property.findByPk(req.params.id);
    if (!property) return errorResponse(res, 'Property not found', 404);

    // Authorization check
    if (property.owner_id !== req.user.id && req.user.role !== 'Admin') {
      return errorResponse(res, 'Unauthorised access', 403);
    }

    await property.update(req.body);
    return successResponse(res, property, 'Property updated successfully');
  } catch (error) {
    return errorResponse(res, 'Update failed', 500);
  }
};

/**
 * Update status (Rented, Sold, Unavailable)
 */
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const property = await Property.findByPk(req.params.id);
    
    if (!property) return errorResponse(res, 'Property not found', 404);
    if (property.owner_id !== req.user.id && req.user.role !== 'Admin') {
      return errorResponse(res, 'Unauthorised', 403);
    }

    await property.update({ availability_status: status });
    return successResponse(res, property, `Property marked as ${status}`);
  } catch (error) {
    return errorResponse(res, 'Status update failed', 500);
  }
};

/**
 * Delete property
 */
exports.deleteProperty = async (req, res) => {
  try {
    const property = await Property.findByPk(req.params.id);
    if (!property) return errorResponse(res, 'Property not found', 404);

    if (property.owner_id !== req.user.id && req.user.role !== 'Admin') {
      return errorResponse(res, 'Unauthorised', 403);
    }

    await property.destroy();
    return successResponse(res, null, 'Property listing deleted');
  } catch (error) {
    return errorResponse(res, 'Deletion failed', 500);
  }
};

/**
 * Placeholder for image uploads and agent assignment
 */
exports.uploadImages = async (req, res) => {
    return successResponse(res, null, 'Images uploaded successfully');
};

exports.assignAgent = async (req, res) => {
    return successResponse(res, null, 'Agent assigned to property');
};
