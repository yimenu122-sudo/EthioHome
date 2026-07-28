const express = require('express');
const router = express.Router();
const landManagerController = require('../controllers/land-manager.controller');
const auth = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');
const { rejectPropertySchema, propertyIdSchema } = require('../validations/land-manager.validation');
const { errorResponse } = require('../utils/response');

const validate = (schema, property = 'body') => (req, res, next) => {
  const { error } = schema.validate(req[property]);
  if (error) return errorResponse(res, error.details[0].message, 400);
  next();
};

// All routes require Land_Manager role
router.use(auth);
router.use(authorize('Land_Manager'));

router.get('/dashboard/stats', landManagerController.getDashboardStats);
router.get('/properties', landManagerController.getProperties);
router.get('/properties/:id', validate(propertyIdSchema, 'params'), landManagerController.getPropertyDetails);

router.post('/properties/:id/verify', validate(propertyIdSchema, 'params'), landManagerController.verifyProperty);
router.post('/properties/:id/reject', validate(propertyIdSchema, 'params'), validate(rejectPropertySchema), landManagerController.rejectProperty);

router.get('/documents/:propertyId', landManagerController.getDocuments);
router.get('/document/:id', landManagerController.getDocumentDetails);
router.post('/documents/:id/verify', landManagerController.verifyDocument);

router.get('/history', landManagerController.getHistory);

module.exports = router;
