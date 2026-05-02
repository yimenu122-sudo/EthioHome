const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const cityAdminController = require('../controllers/admin/city.admin.controller');
// Note: In a real app, you'd add authMiddleware and roleMiddleware here
// const { protect, restrictTo } = require('../middlewares/auth.middleware');

router.get('/dashboard/overview', adminController.getOverview);
router.get('/dashboard/charts', adminController.getChartData);
router.get('/audit-logs/recent', adminController.getRecentAuditLogs);

// User Management
router.get('/users', adminController.getUsers);
router.put('/users/:id/status', adminController.updateUserStatus);
router.put('/users/:id/role', adminController.updateUserRole);
router.get('/users/:id/details', adminController.getUserDetails);
router.post('/users/:id/reset-password', adminController.resetUserPassword);
router.delete('/users/:id', adminController.deleteUser);

// Property Management
router.get('/properties', adminController.getAdminProperties);
router.put('/properties/:id/status', adminController.updatePropertyStatus);
router.get('/properties/:id/details', adminController.getPropertyAdminDetails);
router.delete('/properties/:id', adminController.deleteProperty);

// Agent Management
router.get('/agents', adminController.getAgents);
router.post('/agents', adminController.registerAgent);
router.get('/commissions/overview', adminController.getCommissionOverview);

// Reports
router.get('/reports/financial', adminController.getFinancialReports);
router.get('/reports/users', adminController.getUserReports);
router.get('/reports/properties', adminController.getPropertyReports);

// Disputes
router.get('/disputes', adminController.getDisputes);
router.get('/disputes/:id', adminController.getDisputeDetails);
router.post('/disputes/:id/resolve', adminController.resolveDispute);

// System Configuration
router.get('/settings', adminController.getSystemSettings);
router.put('/settings', adminController.updateSystemSettings);
router.post('/maintenance/backup', adminController.runSystemBackup);

// City Management (City Expansion)
router.get('/cities', cityAdminController.getAllCities);
router.post('/cities', cityAdminController.createCity);
router.put('/cities/:id', cityAdminController.updateCity);
router.delete('/cities/:id', cityAdminController.deleteCity);
router.patch('/cities/:id/toggle', cityAdminController.toggleCityActive);
router.post('/cities/bulk', cityAdminController.bulkCreateCities);

module.exports = router;
