const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transaction.controller');
const auth = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');

/**
 * @route POST /api/transactions
 * @desc Create a new property transaction (Sale/Rent)
 * @access Private (Owner/Agent/Admin)
 */
router.post('/', auth, authorize('Owner', 'Agent', 'Admin'), transactionController.createTransaction);

/**
 * @route GET /api/transactions/my
 * @desc Get my transactions
 * @access Private
 */
router.get('/my', auth, transactionController.getMyTransactions);

module.exports = router;
