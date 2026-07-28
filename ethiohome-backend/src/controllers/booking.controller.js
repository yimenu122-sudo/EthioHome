/**
 * @file booking.controller.js
 * @description Inquiries and visit scheduling for EthioHome properties
 */

const { sequelize, pool } = require('../config/db');
const { successResponse, errorResponse } = require('../utils/response');
const { Booking, Property, User, Transaction } = require('../models/associations');
const NotificationService = require('../services/notification.service');

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

    let visitorInfo = { first_name, last_name, phone, email, role };
    
    // If authenticated, fetch full user profile to ensure we have name/phone
    if (req.user) {
      const fullUser = await User.findByPk(req.user.id);
      if (fullUser) {
        visitorInfo.first_name = fullUser.first_name;
        visitorInfo.last_name = fullUser.last_name;
        visitorInfo.phone = fullUser.phone_number;
        visitorInfo.email = fullUser.email;
        visitorInfo.role = fullUser.role;
      }
    }

    const bookingData = {
      property_id,
      owner_id: property.owner_id,
      agent_id: property.agent_id,
      listing_type: property.listing_type,
      visit_date,
      message: message || 'Interested in viewing this property.',
      booking_status: 'Pending',
      negotiated_price: property.price,
      buyer_renter_id: req.user ? req.user.id : null,
      buyer_tenant_first_name: visitorInfo.first_name,
      buyer_tenant_last_name: visitorInfo.last_name,
      buyer_tenant_phone: visitorInfo.phone,
      buyer_tenant_email: visitorInfo.email,
      buyer_tenant_role: visitorInfo.role
    };

    const booking = await Booking.create(bookingData);

    // Notify Agent and Owner (Only In-App for Agent)
    const propertyTitle = property.title || 'a property';
    const msg = `A new visit has been scheduled for "${propertyTitle}" by ${visitorInfo.first_name || 'a client'}.`;
    
    if (booking.agent_id) {
      await NotificationService.sendInAppNotification(
        booking.agent_id, 
        'New Visit Request', 
        msg,
        'Booking',
        booking.booking_id
      );
    }
    
    await NotificationService.sendInAppNotification(
      booking.owner_id, 
      'New Visit Request', 
      msg,
      'Booking',
      booking.booking_id
    );

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
        { model: Property, attributes: ['title', 'city', 'price', 'property_image'] },
        { model: User, as: 'agent', attributes: ['user_id', 'first_name', 'last_name', 'phone_number'] }
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
          include: [{ model: User, as: 'agent', attributes: ['user_id', 'first_name', 'last_name', 'phone_number'] }]
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

    // --- SENIOR LOGIC: Deal Closure Flow (Agreements) ---
    if (status === 'Approved') {
      
      // Check if transaction already exists for this booking
      const existingTx = await Transaction.findOne({ where: { booking_id: booking.booking_id } });
      
      if (!existingTx) {
        // Fetch property details for price if needed
        const property = await Property.findByPk(booking.property_id);
        
        await Transaction.create({
          property_id: booking.property_id,
          booking_id: booking.booking_id,
          owner_id: booking.owner_id,
          agent_id: booking.agent_id,
          buyer_renter_id: booking.buyer_renter_id,
          transaction_type: booking.listing_type,
          agreed_price: booking.negotiated_price || (property ? property.price : 0),
          contract_date: new Date(),
          transaction_status: 'Pending'
        });
        console.log(`Transaction (Agreement) created for booking ${booking.booking_id}`);
      }
    }

    // --- SENIOR LOGIC: Approval Workflow ---
    if (status === 'Approved') {
      // 1. Notify Client (Buyer/Renter)
      const clientEmail = booking.buyer_tenant_email;
      if (clientEmail) {
        const clientSubject = 'EthioHome - Visit Request Approved! 🏠';
        const clientBody = `
          <div style="font-family: sans-serif; color: #333;">
            <h2>Hello ${booking.buyer_tenant_first_name || 'there'},</h2>
            <p>Great news! Your visit request for <b>${booking.Property?.title}</b> has been approved by the agent.</p>
            <p>The agent will contact you shortly to coordinate the exact time.</p>
            <hr/>
            <p>Visit Date: ${new Date(booking.visit_date).toLocaleDateString()}</p>
          </div>
        `;
        await NotificationService.sendEmail(clientEmail, clientSubject, clientBody);
      }
      
      // Send In-App Notification to Client if they are registered
      if (booking.buyer_renter_id) {
        await NotificationService.sendInAppNotification(booking.buyer_renter_id, 'Visit Approved', 'Your visit has been approved.', 'Booking', booking.booking_id);
      }

      // 2. Notify Owner
      // Fetch Owner details to send email
      const owner = await User.findByPk(booking.owner_id);
      if (owner && owner.email) {
        const ownerSubject = 'EthioHome - Appointment Approved for Your Property';
        const ownerBody = `
          <div style="font-family: sans-serif; color: #333;">
            <h2>Hello ${owner.first_name},</h2>
            <p>An agent has approved a visit request for your property: <b>${booking.Property?.title}</b>.</p>
            <p>The visit is tentatively scheduled for ${new Date(booking.visit_date).toLocaleDateString()}.</p>
          </div>
        `;
        await NotificationService.sendEmail(owner.email, ownerSubject, ownerBody);
      }
      await NotificationService.sendInAppNotification(booking.owner_id, 'Visit Approved', 'An agent has approved a visit request for your property.', 'Booking', booking.booking_id);

      // 3. Auto-Initialize Chat (Seed a welcome message)
      if (booking.buyer_renter_id && booking.agent_id) {
        const welcomeMessage = `Hello ${booking.buyer_tenant_first_name}, I've approved your visit request for ${booking.Property?.title}. Let's coordinate a suitable time for the viewing.`;
        
        // Insert into chat_messages to "create" the thread
        await pool.query(
          'INSERT INTO chat_messages (sender_id, receiver_id, message) VALUES ($1, $2, $3)',
          [booking.agent_id, booking.buyer_renter_id, welcomeMessage]
        );
      }
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

    // Notify Staff & Client
    await NotificationService.sendInAppNotification(booking.owner_id, 'Visit Cancelled', 'A visit has been cancelled.', 'Booking', booking.booking_id);
    if (booking.agent_id) {
        await NotificationService.sendInAppNotification(booking.agent_id, 'Visit Cancelled', 'A visit has been cancelled.', 'Booking', booking.booking_id);
    }
    
    // Notify the Buyer/Renter if the agent cancelled
    if (booking.buyer_tenant_email) {
      await NotificationService.sendEmail(
        booking.buyer_tenant_email,
        'EthioHome - Visit Cancelled',
        `<p>Your visit has been cancelled.</p>`
      );
    }
    if (booking.buyer_renter_id) {
      await NotificationService.sendInAppNotification(booking.buyer_renter_id, 'Visit Cancelled', 'Your visit has been cancelled.', 'Booking', booking.booking_id);
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

        // Access Control: Allow Buyer/Renter, assigned Agent, or Admin
        const isRequester = booking.buyer_renter_id === req.user.id;
        const isAssignedAgent = booking.agent_id === req.user.id;
        const isAdmin = req.user.role === 'Admin';

        if (!isRequester && !isAssignedAgent && !isAdmin) {
            return errorResponse(res, 'Unauthorised', 403);
        }

        if (booking.booking_status === 'Cancelled') {
            return errorResponse(res, 'Cannot reschedule a cancelled booking', 400);
        }

        // Validation: 4 hours before the current visiting time
        const currentVisitDate = new Date(booking.visit_date);
        const now = new Date();
        const diffHours = (currentVisitDate - now) / (1000 * 60 * 60);

        if (diffHours < 4) {
            return errorResponse(res, 'Rescheduling must be done at least 4 hours before the visiting time', 400);
        }

        await booking.update({ visit_date, message: message || booking.message });

        // Notify Staff
        await NotificationService.sendInAppNotification(booking.owner_id, 'Visit Rescheduled', 'A visit has been rescheduled.', 'Booking', booking.booking_id);
        if (booking.agent_id) {
            await NotificationService.sendInAppNotification(booking.agent_id, 'Visit Rescheduled', 'A visit has been rescheduled.', 'Booking', booking.booking_id);
        }
        
        // Notify Client
        if (booking.buyer_tenant_email) {
          await NotificationService.sendEmail(
            booking.buyer_tenant_email,
            'EthioHome - Visit Rescheduled',
            `<p>Your visit has been rescheduled to ${new Date(visit_date).toLocaleString()}.</p>`
          );
        }
        if (booking.buyer_renter_id) {
          await NotificationService.sendInAppNotification(booking.buyer_renter_id, 'Visit Rescheduled', 'Your visit has been rescheduled.', 'Booking', booking.booking_id);
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

/**
 * Update negotiation details (Price and Status)
 * Allows Buyer/Renter, Owner, or Agent to participate
 */
exports.updateNegotiation = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, negotiated_price } = req.body;
    const userId = req.user.id;

    const booking = await Booking.findByPk(id, {
        include: [{ model: Property }]
    });

    if (!booking) return errorResponse(res, 'Booking not found', 404);

    // Authorization: Must be one of the parties involved
    const isOwner = booking.owner_id === userId;
    const isAgent = booking.agent_id === userId;
    const isClient = booking.buyer_renter_id === userId;
    const isAdmin = req.user.role === 'Admin';

    if (!isOwner && !isAgent && !isClient && !isAdmin) {
      return errorResponse(res, 'Unauthorised to update this negotiation', 403);
    }

    const updates = {};
    if (status) updates.booking_status = status;
    if (negotiated_price !== undefined) updates.negotiated_price = negotiated_price;

    await booking.update(updates);

    // If approved, trigger transaction flow (same as updateStatus logic)
    if (status === 'Approved') {
        const existingTx = await Transaction.findOne({ where: { booking_id: booking.booking_id } });
        if (!existingTx) {
            const property = await Property.findByPk(booking.property_id);
            await Transaction.create({
                property_id: booking.property_id,
                booking_id: booking.booking_id,
                owner_id: booking.owner_id,
                agent_id: booking.agent_id,
                buyer_renter_id: booking.buyer_renter_id,
                transaction_type: booking.listing_type,
                agreed_price: booking.negotiated_price || (property ? property.price : 0),
                contract_date: new Date(),
                transaction_status: 'Pending'
            });
        }
        
        // Notify other parties
        const notificationTarget = isClient ? (booking.agent_id || booking.owner_id) : booking.buyer_renter_id;
        await NotificationService.sendInAppNotification(notificationTarget, 'Negotiation Approved', 'The negotiation has been approved.', 'Booking', booking.booking_id);
    } else if (status === 'Negotiating') {
        const notificationTarget = isClient ? (booking.agent_id || booking.owner_id) : booking.buyer_renter_id;
        await NotificationService.sendInAppNotification(notificationTarget, 'New Counter Offer', 'You have received a new counter offer.', 'Booking', booking.booking_id);
    }

    return successResponse(res, booking, 'Negotiation updated successfully');
  } catch (error) {
    console.error('Update Negotiation Error:', error);
    return errorResponse(res, 'Failed to update negotiation', 500);
  }
};

/**
 * Reschedule booking
 */
exports.rescheduleBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { visit_date, message } = req.body;
    const userId = req.user.id;

    const booking = await Booking.findByPk(id);
    if (!booking) return errorResponse(res, 'Booking not found', 404);

    const isOwner = booking.owner_id === userId;
    const isAgent = booking.agent_id === userId;
    const isClient = booking.buyer_renter_id === userId;
    const isAdmin = req.user?.role === 'Admin';

    if (!isOwner && !isAgent && !isClient && !isAdmin) {
      return errorResponse(res, 'Unauthorised to reschedule this booking', 403);
    }

    // 4-hour rule: Cannot reschedule if the visit time is less than 4 hours away
    if (booking.visit_date) {
      const visitTime = new Date(booking.visit_date).getTime();
      const currentTime = new Date().getTime();
      const hoursDifference = (visitTime - currentTime) / (1000 * 60 * 60);

      if (hoursDifference < 4 && hoursDifference > 0) {
        return errorResponse(res, 'Cannot reschedule an appointment less than 4 hours before the scheduled time', 400);
      }
    }

    booking.visit_date = visit_date;
    if (message) booking.message = message;
    booking.booking_status = 'Pending'; // Revert to pending for re-approval
    await booking.save();

    // Notify relevant party
    const notificationTarget = isClient ? (booking.agent_id || booking.owner_id) : booking.buyer_renter_id;
    if (notificationTarget) {
      await NotificationService.sendInAppNotification(
        notificationTarget, 
        'Visit Rescheduled', 
        'A visit appointment has been rescheduled.', 
        'Booking', 
        booking.booking_id
      );
    }

    return successResponse(res, booking, 'Booking rescheduled successfully');
  } catch (error) {
    console.error('Reschedule Error:', error);
    return errorResponse(res, 'Failed to reschedule booking', 500);
  }
};

/**
 * Cancel booking
 */
exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const booking = await Booking.findByPk(id);
    if (!booking) return errorResponse(res, 'Booking not found', 404);

    const isOwner = booking.owner_id === userId;
    const isAgent = booking.agent_id === userId;
    const isClient = booking.buyer_renter_id === userId;
    const isAdmin = req.user?.role === 'Admin';

    if (!isOwner && !isAgent && !isClient && !isAdmin) {
      return errorResponse(res, 'Unauthorised to cancel this booking', 403);
    }

    booking.booking_status = 'Cancelled';
    await booking.save();

    return successResponse(res, booking, 'Booking cancelled successfully');
  } catch (error) {
    console.error('Cancel Error:', error);
    return errorResponse(res, 'Failed to cancel booking', 500);
  }
};

/**
 * Confirm Transaction
 */
exports.confirmTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findByPk(id);
    if (!booking) return errorResponse(res, 'Booking not found', 404);

    booking.booking_status = 'Approved';
    await booking.save();

    return successResponse(res, booking, 'Transaction confirmed successfully');
  } catch (error) {
    console.error('Confirm Error:', error);
    return errorResponse(res, 'Failed to confirm transaction', 500);
  }
};
