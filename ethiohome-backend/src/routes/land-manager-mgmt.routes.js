/**
 * @file land-manager-mgmt.routes.js
 * @description Routes for Agent management of Land Managers
 */
const express = require('express');
const router = express.Router();
const landManagerMgmtController = require('../controllers/land-manager-mgmt.controller');
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');
const validate = require('../middlewares/validation.middleware');
const { registerLandManagerSchema, updateLandManagerSchema } = require('../validations/land-manager-mgmt.validation');


// All routes are protected and restricted to Agents and Admins
router.use(auth);
router.use(role(['Agent', 'Admin']));

router.get('/', landManagerMgmtController.getAll);
router.post('/', validate(registerLandManagerSchema), landManagerMgmtController.register);
router.put('/:id', validate(updateLandManagerSchema), landManagerMgmtController.update);
router.get('/statistics', landManagerMgmtController.getStatistics);
router.patch('/:id/status', landManagerMgmtController.toggleStatus);

module.exports = router;
