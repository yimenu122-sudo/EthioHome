const { pool } = require('../config/db');

exports.getAllCities = async (req, res) => {
    try {
        const result = await pool.query('SELECT name_en, name_am, region, is_active FROM cities WHERE is_active = true ORDER BY name_en ASC');
        res.status(200).json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching cities:', error);
        res.status(500).json({ success: false, message: 'Server error fetching cities' });
    }
};
