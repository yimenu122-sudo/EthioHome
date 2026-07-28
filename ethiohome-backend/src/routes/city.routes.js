const express = require('express');
const router = express.Router();
const cityController = require('../controllers/city.controller');

router.get('/', cityController.getAllCities);
router.get('/sub-cities', cityController.getSubCities);

module.exports = router;
