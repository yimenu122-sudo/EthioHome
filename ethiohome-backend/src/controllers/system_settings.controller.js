/**
 * @file system_settings.controller.js
 * @description Controller for managing platform-wide settings
 */

const SystemSetting = require('../models/system_setting.model');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * Get the commission settings (Rent and Sale split)
 */
exports.getCommissionSettings = async (req, res) => {
  try {
    const setting = await SystemSetting.findOne({
      where: { key: 'rent_sale_split' }
    });

    if (!setting) {
      // Fallback to default if not found in DB
      return successResponse(res, { rent: 9, sale: 2 }, 'Default commission settings');
    }

    return successResponse(res, setting.value, 'Commission settings fetched successfully');
  } catch (error) {
    console.error('Fetch Commission Settings Error:', error);
    return errorResponse(res, 'Failed to fetch commission settings', 500);
  }
};

/**
 * Get all settings in a category
 */
exports.getSettingsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const settings = await SystemSetting.findAll({
      where: { category }
    });
    
    // Transform into a simple key-value object
    const settingsObj = {};
    settings.forEach(s => {
      settingsObj[s.key] = s.value;
    });

    return successResponse(res, settingsObj, `Settings for category ${category} fetched`);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch settings', 500);
  }
};
