/**
 * @file booking.routes.js
 * @description Routes for visit scheduling and rental workflows
 * @author Senior Node.js Developer
 */

const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');
const { ROLES } = require('../config/roles');

// Request a booking/visit - Public (Guest) or Authenticated
router.post('/', (req, res, next) => {
  // Try authentication but don't strictly require it for the POST / route
  // We'll handle both cases in the controller
  auth(req, res, (err) => {
    // If there's an error (e.g. no token), just proceed as guest
    next();
  });
}, bookingController.createBooking);

router.use(auth);

// Get all bookings - Filtered by role in controller
router.get('/', bookingController.getBookings);

// Get specific booking
router.get('/me', bookingController.getMyBookings);
router.get('/:id', bookingController.getBookingById);

// Update status (Approve/Reject) - Owners, Agents or Admin
router.put('/:id/status', 
  role([ROLES.OWNER, ROLES.AGENT, ROLES.ADMIN]), 
  bookingController.updateStatus
);

// Reschedule booking - User who made it
router.patch('/:id', bookingController.rescheduleBooking);

// Cancel booking - Requester, Owner, Agent or Admin
router.patch('/:id/cancel', bookingController.cancelBooking);

// Confirm Transaction (Update status as part of manual flow)
router.put('/:id/confirm', bookingController.confirmTransaction);

module.exports = router;
