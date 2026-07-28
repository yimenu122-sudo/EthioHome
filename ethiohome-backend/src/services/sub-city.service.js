/**
 * @file sub-city.service.js
 * @description Business logic for Sub-city management
 */
const SubCity = require('../models/sub_city.model');
const Property = require('../models/property.model');

class SubCityService {
  async getAll(filters) {
    return await SubCity.getAll(filters);
  }

  async getById(id) {
    return await SubCity.findById(id);
  }

  async create(data) {
    return await SubCity.create(data);
  }

  async update(id, data) {
    return await SubCity.update(id, data);
  }

  async getAnalytics(id) {
    return await SubCity.getAnalytics(id);
  }

  async getProperties(id, filters) {
    return await SubCity.getProperties(id, filters);
  }

  async findByNameEn(city_id, name_en) {
    return await SubCity.findByNameEn(city_id, name_en);
  }

  async delete(id) {
    return await SubCity.delete(id);
  }
}

module.exports = new SubCityService();
