/**
 * @file sub-city.controller.js
 * @description Controller for Sub-city management
 */
const subCityService = require('../services/sub-city.service');
const City = require('../models/city.model');
const User = require('../models/user.model');

class SubCityController {
  /**
   * Get all sub-cities with optional filtering
   */
  async getAllSubCities(req, res) {
    try {
      const { search, is_active } = req.query;
      let city_id = req.query.city_id;

      // If user is an Agent, they can only see sub-cities in their assigned city
      if (req.user.role === 'Agent') {
        const agent = await User.findById(req.user.id);
        if (!agent || !agent.city) {
          return res.status(400).json({ status: 'error', message: 'Agent must be assigned to a city' });
        }
        
        // Find city ID by name
        const city = await City.findByNameEn(agent.city);
        if (!city) {
          return res.status(404).json({ status: 'error', message: 'Assigned city not found' });
        }
        city_id = city.id;
      }

      const subCities = await subCityService.getAll({ city_id, search, is_active });
      
      // Fetch stats for each sub-city
      const subCitiesWithStats = await Promise.all(subCities.map(async (sc) => {
        const stats = await subCityService.getAnalytics(sc.id);
        return { ...sc, stats };
      }));

      res.status(200).json({
        status: 'success',
        results: subCitiesWithStats.length,
        data: subCitiesWithStats
      });
    } catch (error) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  }

  /**
   * Create new sub-city
   */
  async createSubCity(req, res) {
    try {
      const { name_en, name_am, is_active } = req.body;
      let city_id = req.body.city_id;

      // Authorization & Scope check for Agents
      if (req.user.role === 'Agent') {
        const agent = await User.findById(req.user.id);
        const city = await City.findByNameEn(agent.city);
        city_id = city.id;
      }

      // Check for duplicates
      const existing = await subCityService.findByNameEn(city_id, name_en);
      if (existing) {
        return res.status(400).json({ status: 'error', message: 'Sub-city already exists in this city' });
      }

      const newSubCity = await subCityService.create({ city_id, name_en, name_am, is_active });
      res.status(201).json({ status: 'success', data: newSubCity });
    } catch (error) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  }

  /**
   * Update sub-city
   */
  async updateSubCity(req, res) {
    try {
      const { id } = req.params;
      const subCity = await subCityService.getById(id);
      if (!subCity) return res.status(404).json({ status: 'error', message: 'Sub-city not found' });

      // Agent check
      if (req.user.role === 'Agent') {
        const agent = await User.findById(req.user.id);
        const city = await City.findByNameEn(agent.city);
        if (subCity.city_id !== city.id) {
          return res.status(403).json({ status: 'error', message: 'Unauthorized to manage sub-cities outside your city' });
        }
      }

      const updated = await subCityService.update(id, { ...subCity, ...req.body });
      res.status(200).json({ status: 'success', data: updated });
    } catch (error) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  }

  /**
   * Toggle status
   */
  async toggleStatus(req, res) {
    try {
      const { id } = req.params;
      const subCity = await subCityService.getById(id);
      if (!subCity) return res.status(404).json({ status: 'error', message: 'Sub-city not found' });

      // Agent check
      if (req.user.role === 'Agent') {
        const agent = await User.findById(req.user.id);
        const city = await City.findByNameEn(agent.city);
        if (subCity.city_id !== city.id) {
          return res.status(403).json({ status: 'error', message: 'Unauthorized' });
        }
      }

      const updated = await subCityService.update(id, { ...subCity, is_active: !subCity.is_active });
      res.status(200).json({ status: 'success', data: updated });
    } catch (error) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  }

  /**
   * Get analytics
   */
  async getAnalytics(req, res) {
    try {
      const { id } = req.params;
      const stats = await subCityService.getAnalytics(id);
      res.status(200).json({ status: 'success', data: stats });
    } catch (error) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  }

  /**
   * Get properties
   */
  async getProperties(req, res) {
    try {
      const { id } = req.params;
      const { limit, offset } = req.query;
      const properties = await subCityService.getProperties(id, { limit, offset });
      res.status(200).json({ status: 'success', data: properties });
    } catch (error) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  }

  /**
   * Delete sub-city
   */
  async deleteSubCity(req, res) {
    try {
      const { id } = req.params;
      const subCity = await subCityService.getById(id);
      if (!subCity) return res.status(404).json({ status: 'error', message: 'Sub-city not found' });

      // Agent authorization check
      if (req.user.role === 'Agent') {
        const agent = await User.findById(req.user.id);
        const city = await City.findByNameEn(agent.city);
        if (subCity.city_id !== city.id) {
          return res.status(403).json({ status: 'error', message: 'Unauthorized to delete sub-cities outside your city' });
        }
      }

      await subCityService.delete(id);
      res.status(200).json({ status: 'success', message: 'Sub-city deleted successfully' });
    } catch (error) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  }
}

module.exports = new SubCityController();
