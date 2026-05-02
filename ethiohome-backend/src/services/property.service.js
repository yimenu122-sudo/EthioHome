/**
 * @file property.service.js
 * @description Business logic for property listings and lifecycle
 */

const Property = require('../models/property.model');
const { Op } = require('sequelize');

class PropertyService {
  async createProperty(ownerId, data) {
    return await Property.create({
      ...data,
      owner_id: ownerId,
      availability_status: 'Available'
    });
  }

  async updateProperty(propertyId, userId, role, data) {
    const property = await Property.findByPk(propertyId);
    if (!property) throw new Error('Property not found');

    // Ownership check (Agent assigned logic would go here)
    if (property.owner_id !== userId && role !== 'Admin' && role !== 'Agent') {
      throw new Error('Unauthorized update attempt');
    }

    return await property.update(data);
  }

  async deleteProperty(propertyId, userId, role) {
    const property = await Property.findByPk(propertyId);
    if (!property) throw new Error('Property not found');

    if (property.owner_id !== userId && role !== 'Admin') {
      throw new Error('Unauthorized deletion attempt');
    }

    return await property.destroy();
  }

  async getPropertyById(propertyId) {
    return await Property.findByPk(propertyId);
  }

  async searchProperties(filters) {
    const { city, listing_type, type, minPrice, maxPrice, bedrooms, limit = 10, page = 1 } = filters;
    const where = { availability_status: 'Available' };

    if (city) where.city = { [Op.iLike]: `%${city}%` };
    if (listing_type) where.listing_type = listing_type;
    if (type) where.property_type = type;
    
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Op.gte] = minPrice;
      if (maxPrice) where.price[Op.lte] = maxPrice;
    }

    if (bedrooms) where.number_of_bedrooms = bedrooms;

    return await Property.findAndCountAll({
      where,
      limit,
      offset: (page - 1) * limit,
      order: [['created_at', 'DESC']]
    });
  }

  async updatePropertyStatus(propertyId, status) {
    return await Property.update(
      { availability_status: status },
      { where: { property_id: propertyId } }
    );
  }
}

module.exports = new PropertyService();
