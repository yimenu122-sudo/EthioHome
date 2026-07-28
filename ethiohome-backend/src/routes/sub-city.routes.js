/**
 * @file sub-city.routes.js
 * @description Routes for Sub-city management
 */
const express = require('express');
const router = express.Router();
const subCityController = require('../controllers/sub-city.controller');
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');
const audit = require('../middlewares/audit.middleware');
const validate = require('../middlewares/validation.middleware');
const { subCitySchema, subCityIdSchema } = require('../validations/sub-city.validation');


/**
 * @route GET /api/v1/sub-cities
 * @desc Get all sub-cities (filtered for agents)
 * @access Private (Agent, Admin)
 */
router.get('/', auth, role(['Agent', 'Admin']), subCityController.getAllSubCities);

/**
 * @route POST /api/v1/sub-cities
 * @desc Create new sub-city
 * @access Private (Agent, Admin)
 */
router.post('/', auth, role(['Agent', 'Admin']), validate(subCitySchema), audit('CREATE_SUB_CITY'), subCityController.createSubCity);

/**
 * @route PUT /api/v1/sub-cities/:id
 * @desc Update sub-city
 * @access Private (Agent, Admin)
 */
router.put('/:id', auth, role(['Agent', 'Admin']), validate(subCityIdSchema, 'params'), validate(subCitySchema), audit('UPDATE_SUB_CITY'), subCityController.updateSubCity);

/**
 * @route PATCH /api/v1/sub-cities/:id/status
 * @desc Toggle active status
 * @access Private (Agent, Admin)
 */
router.patch('/:id/status', auth, role(['Agent', 'Admin']), validate(subCityIdSchema, 'params'), audit('TOGGLE_SUB_CITY_STATUS'), subCityController.toggleStatus);

/**
 * @route GET /api/v1/sub-cities/:id/analytics
 * @desc Get sub-city property analytics
 * @access Private (Agent, Admin)
 */
router.get('/:id/analytics', auth, role(['Agent', 'Admin']), validate(subCityIdSchema, 'params'), subCityController.getAnalytics);

/**
 * @route GET /api/v1/sub-cities/:id/properties
 * @desc Get properties in sub-city
 * @access Private (Agent, Admin)
 */
router.get('/:id/properties', auth, role(['Agent', 'Admin']), validate(subCityIdSchema, 'params'), subCityController.getProperties);

/**
 * @route DELETE /api/v1/sub-cities/:id
 * @desc Delete sub-city
 * @access Private (Agent, Admin)
 */
router.delete('/:id', auth, role(['Agent', 'Admin']), validate(subCityIdSchema, 'params'), audit('DELETE_SUB_CITY'), subCityController.deleteSubCity);

module.exports = router;
