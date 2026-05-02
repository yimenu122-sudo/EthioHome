/**
 * @file booking.controller.js
 * @description Inquiries and visit scheduling for EthioHome properties
 */

const Booking = require('../models/booking.model');
const Property = require('../models/property.model');
const User = require('../models/user.sequelize');
const NotificationService = require('../services/notification.service');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * Request a visit for a property
 */
exports.createBooking = async (req, res) => {
  try {
    const { 
      property_id, 
      visit_date, 
      message,
      first_name,
      last_name,
      phone,
      email,
      role = 'Buyer'
    } = req.body;

    const property = await Property.findByPk(property_id);
    if (!property) return errorResponse(res, 'Property not found', 404);

    if (property.availability_status !== 'Available') {
      return errorResponse(res, 'Property is no longer available for booking', 400);
    }

    const bookingData = {
      property_id,
      owner_id: property.owner_id,
      agent_id: property.agent_id,
      listing_type: property.listing_type,
      visit_date,
      message: message || 'Interested in viewing this property.',
      booking_status: 'Pending',
      buyer_renter_id: req.user ? req.user.id : null, // Track authenticated user
      buyer_tenant_first_name: req.user ? req.user.first_name || first_name : first_name,
      buyer_tenant_last_name: req.user ? req.user.last_name || last_name : last_name,
      buyer_tenant_phone: req.user ? req.user.phone_number || phone : phone,
      buyer_tenant_email: req.user ? req.user.email || email : email,
      buyer_tenant_role: req.user ? req.user.role || role : role
    };

    const booking = await Booking.create(bookingData);

    // Notify Agent and Owner
    if (booking.agent_id) {
      await NotificationService.sendInAppNotification(booking.agent_id, booking.booking_id, 'NEW_BOOKING_REQUEST');
    }
    await NotificationService.sendInAppNotification(booking.owner_id, booking.booking_id, 'NEW_BOOKING_REQUEST');

    return successResponse(res, booking, 'Visit request submitted', 201);
  } catch (error) {
    console.error('Create Booking Error:', error);
    return errorResponse(res, 'Booking request failed', 500, error.message);
  }
};

/**
 * Get bookings for the current user (as owner or assigned agent)
 */
exports.getBookings = async (req, res) => {
  try {
    const where = {};
    if (req.user.role === 'Owner') {
      where.owner_id = req.user.id;
    } else if (req.user.role === 'Agent') {
      where.agent_id = req.user.id;
    }

    const bookings = await Booking.findAll({ 
      where,
      include: [
        { model: Property, attributes: ['title', 'city', 'price', 'property_image'] }
      ]
    });

    return successResponse(res, bookings, 'Bookings fetched');
  } catch (error) {
    return errorResponse(res, 'Failed to fetch bookings', 500);
  }
};

/**
 * Get my bookings (as a Renter/Buyer)
 */
exports.getMyBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const bookings = await Booking.findAll({ 
      where: { buyer_renter_id: userId },
      include: [
        { 
          model: Property, 
          attributes: ['title', 'city', 'price', 'property_type', 'property_image', 'listing_type'],
          include: [{ model: User, as: 'agent', attributes: ['first_name', 'last_name', 'phone_number'] }]
        }
      ],
      order: [['visit_date', 'DESC']]
    });

    return successResponse(res, bookings, 'My appointments fetched');
  } catch (error) {
    console.error('Fetch My Bookings Error:', error);
    return errorResponse(res, 'Failed to fetch my appointments', 500);
  }
};

/**
 * Update booking status (Approve/Reject)
 */
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findByPk(req.params.id);
    
    if (!booking) return errorResponse(res, 'Booking not found', 404);

    // Only Owner or assigned Agent can approve
    if (booking.owner_id !== req.user.id && booking.agent_id !== req.user.id && req.user.role !== 'Admin') {
      return errorResponse(res, 'Unauthorised', 403);
    }

    await booking.update({ booking_status: status });

    // Notify Buyer/Renter if approved
    if (status === 'Approved' && booking.buyer_tenant_email) {
      const subject = 'EthioHome - Visit Approved';
      const body = `<h2>Hello ${booking.buyer_tenant_first_name},</h2><p>Your property visit for <b>${booking.Property?.title || 'the selected property'}</b> has been approved by the agent.</p>`;
      await NotificationService.sendEmail(booking.buyer_tenant_email, subject, body);
      
      // Also in-app notification if we had a user_id for them (optional depending on if they are registered)
    }

    return successResponse(res, booking, `Booking status updated to ${status}`);
  } catch (error) {
    return errorResponse(res, 'Update failed', 500);
  }
};

/**
 * Cancel booking (Requester can cancel their own)
 */
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id);
    if (!booking) return errorResponse(res, 'Booking not found', 404);

    // Access control: User who made the booking or Owner/Agent/Admin
    const isOwner = booking.buyer_renter_id === req.user.id;
    const isStaff = ['Owner', 'Agent', 'Admin'].includes(req.user.role);

    if (!isOwner && !isStaff) {
      return errorResponse(res, 'Unauthorised to cancel this booking', 403);
    }

    if (booking.booking_status === 'Cancelled') {
      return errorResponse(res, 'Booking is already cancelled', 400);
    }

    await booking.update({ booking_status: 'Cancelled' });

    // Notify Staff
    await NotificationService.sendInAppNotification(booking.owner_id, booking.booking_id, 'BOOKING_CANCELLED');
    if (booking.agent_id) {
        await NotificationService.sendInAppNotification(booking.agent_id, booking.booking_id, 'BOOKING_CANCELLED');
    }

    return successResponse(res, booking, 'Booking cancelled successfully');
  } catch (error) {
    console.error('Cancel Booking Error:', error);
    return errorResponse(res, 'Cancel failed', 500);
  }
};

exports.getBookingById = async (req, res) => {
    try {
        const booking = await Booking.findByPk(req.params.id, {
            include: [{ model: Property }]
        });
        if (!booking) return errorResponse(res, 'Booking not found', 404);
        return successResponse(res, booking, 'Booking details');
    } catch (error) {
        return errorResponse(res, 'Fetch failed', 500);
    }
};

/**
 * Reschedule booking (Only for Pending or Approved)
 */
exports.rescheduleBooking = async (req, res) => {
    try {
        const { visit_date, message } = req.body;
        const booking = await Booking.findByPk(req.params.id);
        if (!booking) return errorResponse(res, 'Booking not found', 404);

        // Access Control
        if (booking.buyer_renter_id !== req.user.id && req.user.role !== 'Admin') {
            return errorResponse(res, 'Unauthorised', 403);
        }

        if (booking.booking_status === 'Cancelled') {
            return errorResponse(res, 'Cannot reschedule a cancelled booking', 400);
        }

        await booking.update({ visit_date, message: message || booking.message });

        // Notify Staff
        await NotificationService.sendInAppNotification(booking.owner_id, booking.booking_id, 'BOOKING_RESCHEDULED');
        if (booking.agent_id) {
            await NotificationService.sendInAppNotification(booking.agent_id, booking.booking_id, 'BOOKING_RESCHEDULED');
        }

        return successResponse(res, booking, 'Visit rescheduled successfully');
    } catch (error) {
        console.error('Reschedule Booking Error:', error);
        return errorResponse(res, 'Reschedule failed', 500);
    }
};

exports.confirmTransaction = async (req, res) => {
    // Placeholder for manual confirmation if needed outside the transaction flow
    return successResponse(res, null, 'Transaction confirmed manually');
};
