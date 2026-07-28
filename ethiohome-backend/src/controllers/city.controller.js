const { pool } = require('../config/db');
const SubCityModel = require('../models/sub_city.model');


exports.getAllCities = async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name_en, name_am, region, is_active FROM cities WHERE is_active = true ORDER BY name_en ASC');
        res.status(200).json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching cities:', error);
        res.status(500).json({ success: false, message: 'Server error fetching cities' });
    }
};
exports.getSubCities = async (req, res) => {
    try {
        const { city_id } = req.query;
        const subCities = await SubCityModel.getAll({ city_id });
        res.status(200).json({
            success: true,
            data: subCities
        });
    } catch (error) {
        console.error('Error fetching sub-cities:', error);
        res.status(500).json({ success: false, message: 'Server error fetching sub-cities' });
    }
};
