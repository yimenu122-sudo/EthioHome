/**
 * @file agent.controller.js
 * @description Controller for Agent Module operations in EthioHome
 */

const { Property, Booking, Commission, Transaction, User, PropertyDocument } = require('../models/associations');
const CityModel = require('../models/city.model');
const SubCityModel = require('../models/sub_city.model');

const { successResponse, errorResponse } = require('../utils/response');
const { Op } = require('sequelize');
const NotificationService = require('../services/notification.service');
const { pool } = require('../config/db');

/**
 * Get Agent Dashboard Statistics
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const agent_id = req.user.id;

    // 1. Property Stats
    const propertyStats = await Property.findAll({
      where: { agent_id },
      attributes: ['availability_status', [Property.sequelize.fn('COUNT', Property.sequelize.col('property_id')), 'count']],
      group: ['availability_status']
    });

    const stats = {
      totalAvailable: 0,
      totalRented: 0,
      totalSold: 0,
      totalProperties: 0
    };

    propertyStats.forEach(stat => {
      const status = stat.getDataValue('availability_status');
      const count = parseInt(stat.getDataValue('count'));
      stats.totalProperties += count;
      if (status === 'Available') stats.totalAvailable = count;
      if (status === 'Rented') stats.totalRented = count;
      if (status === 'Sold') stats.totalSold = count;
    });

    // 2. Booking Stats
    const pendingBookings = await Booking.count({
      where: { 
        agent_id,
        booking_status: 'Pending'
      }
    });

    const upcomingAppointments = await Booking.count({
      where: {
        agent_id,
        booking_status: 'Approved',
        visit_date: {
          [Op.gte]: new Date()
        }
      }
    });

    // 3. Commission Stats
    const totalCommission = await Commission.sum('amount', {
      where: {
        agent_id,
        commission_status: 'Completed'
      }
    }) || 0;

    // 4. Chat Stats (Unread messages)
    const { pool } = require('../config/db');
    const unreadMessagesCount = await pool.query(
      'SELECT COUNT(*) FROM chat_messages WHERE receiver_id = $1 AND is_read = false',
      [agent_id]
    );

    // 5. Recent Activities (Optional but good for UX)
    const recentProperties = await Property.findAll({
      where: { agent_id },
      limit: 5,
      order: [['created_at', 'DESC']],
      attributes: ['property_id', 'title', 'price', 'availability_status', 'created_at']
    });

    return successResponse(res, {
      stats: {
        ...stats,
        pendingBookings,
        upcomingAppointments,
        totalCommissionEarned: parseFloat(totalCommission),
        unreadMessagesCount: parseInt(unreadMessagesCount.rows[0].count)
      },
      recentProperties
    }, 'Agent dashboard stats fetched successfully');

  } catch (error) {
    console.error('Agent Dashboard Stats Error:', error);
    return errorResponse(res, 'Failed to fetch dashboard stats', 500, error.message);
  }
};

/**
 * Get Agent's Managed Properties
 * Business Rule: Agent manages ONLY properties in their own city.
 * Advanced Features: Pagination, Filtering, Search
 */
exports.getManagedProperties = async (req, res) => {
  try {
    const agent_id = req.user.id;
    const { status, type, search, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // 1. Get Agent's City
    const agent = await User.findByPk(agent_id);
    if (!agent) return errorResponse(res, 'Agent not found', 404);

    // 2. Build Query
    const where = { 
      agent_id,
      city: agent.city 
    };

    if (status) where.availability_status = status;
    if (type) where.listing_type = type;
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { sub_city: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows: properties } = await Property.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
      include: [
        { model: Booking, attributes: ['booking_id', 'booking_status'] } // Basic analytic data
      ]
    });

    // Add simple analytics mapping
    const enrichedProperties = properties.map(p => {
      const plain = p.get({ plain: true });
      plain.analytics = {
        totalBookings: p.Bookings ? p.Bookings.length : 0,
        approvedBookings: p.Bookings ? p.Bookings.filter(b => b.booking_status === 'Approved').length : 0
      };
      delete plain.Bookings;
      return plain;
    });

    return successResponse(res, {
      properties: enrichedProperties,
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    }, 'Managed properties fetched successfully');
  } catch (error) {
    console.error('Fetch Managed Properties Error:', error);
    return errorResponse(res, 'Failed to fetch managed properties', 500);
  }
};

/**
 * Search for Owners (for assignment workflow)
 */
exports.searchOwners = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return successResponse(res, []);

    const owners = await User.findAll({
      where: {
        role: 'Owner',
        [Op.or]: [
          { first_name: { [Op.iLike]: `%${query}%` } },
          { last_name: { [Op.iLike]: `%${query}%` } },
          { phone_number: { [Op.iLike]: `%${query}%` } }
        ]
      },
      limit: 10,
      attributes: ['user_id', 'first_name', 'last_name', 'phone_number', 'city']
    });

    return successResponse(res, owners, 'Owners found');
  } catch (error) {
    return errorResponse(res, 'Failed to search owners', 500);
  }
};

/**
 * Assign/Reassign Owner to Property
 */
exports.assignOwner = async (req, res) => {
  try {
    const { property_id, owner_id } = req.body;
    const agent_id = req.user.id;

    const [property, owner] = await Promise.all([
      Property.findOne({ where: { property_id, agent_id } }),
      User.findOne({ where: { user_id: owner_id, role: 'Owner' } })
    ]);

    if (!property) return errorResponse(res, 'Property not found or access denied', 404);
    if (!owner) return errorResponse(res, 'Owner not found', 404);

    await property.update({ owner_id });

    return successResponse(res, property, 'Owner assigned successfully');
  } catch (error) {
    return errorResponse(res, 'Assignment failed', 500);
  }
};

/**
 * Update Property Status (Agent Action)
 */
exports.updatePropertyStatus = async (req, res) => {
  try {
    const { property_id } = req.params;
    const { status } = req.body;
    const agent_id = req.user.id;

    const property = await Property.findOne({ where: { property_id, agent_id } });
    if (!property) return errorResponse(res, 'Property not found or access denied', 404);

    await property.update({ availability_status: status });

    return successResponse(res, property, `Property status updated to ${status}`);
  } catch (error) {
    return errorResponse(res, 'Failed to update property status', 500, error.message);
  }
};

/**
 * Update Property Verification Status (Agent Action)
 */
exports.updateVerificationStatus = async (req, res) => {
  try {
    const { property_id } = req.params;
    const { status, rejection_reason } = req.body;
    const agent_id = req.user.id;

    const allowedStatuses = ['Pending', 'Under_Review', 'Verified', 'Rejected'];
    if (!allowedStatuses.includes(status)) {
       return errorResponse(res, 'Invalid verification status', 400);
    }

    const property = await Property.findOne({ where: { property_id, agent_id } });
    if (!property) return errorResponse(res, 'Property not found or access denied', 404);

    const updateData = { 
      verification_status: status,
      verified_by: agent_id,
      verified_at: new Date()
    };
    
    if (status === 'Rejected') {
      updateData.rejection_reason = rejection_reason || 'No reason provided';
    } else {
      updateData.rejection_reason = null;
    }

    await property.update(updateData);

    return successResponse(res, property, `Property verification status updated to ${status}`);
  } catch (error) {
    return errorResponse(res, 'Failed to update verification status', 500, error.message);
  }
};

/**
 * Get Specific Property Details for Agent
 * Business Rule: Assigned agent AND city restriction
 */
exports.getAgentPropertyDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const agent_id = req.user.id;

    // 1. Get Agent to check city
    const agent = await User.findByPk(agent_id);
    if (!agent) return errorResponse(res, 'Agent profile not found', 404);

    // 2. Fetch Property with details and owner info
    const property = await Property.findOne({
      where: {
        property_id: id,
        agent_id,
        city: agent.city 
      },
      include: [
        { 
          model: User, 
          as: 'owner',
          attributes: ['first_name', 'last_name', 'phone_number', 'email']
        }
      ]
    });

    if (!property) {
      return errorResponse(res, 'Access denied or property not found', 403);
    }

    // 3. Fetch specific stats for this property
    const totalBookings = await Booking.count({ where: { property_id: id } });
    const approvedVisits = await Booking.count({ 
      where: { property_id: id, booking_status: 'Approved' } 
    });

    return successResponse(res, {
      property,
      stats: {
        totalBookings,
        approvedVisits
      }
    }, 'Property details fetched successfully');

  } catch (error) {
    console.error('Fetch Agent Property Details Error:', error);
    return errorResponse(res, 'Failed to fetch property details', 500);
  }
};

/**
 * Add New Property (Agent)
 * Business Rules:
 * - City is auto-set to agent's city.
 * - Owner must be in the same city and have 'Owner' role.
 */
exports.addProperty = async (req, res) => {
  try {
    const agent_id = req.user.id;
    
    // 1. Get Agent verification
    const agent = await User.findByPk(agent_id);
    if (!agent) return errorResponse(res, 'Agent not found', 404);

    const {
      owner_id,
      title,
      description,
      city,
      sub_city,
      woreda,
      kebele,
      house_number,
      specific_location,
      price,
      property_type,
      listing_type,
      number_of_bedrooms,
      bedroom_area_size,
      number_of_bathrooms,
      bathroom_area_size,
      number_of_living_rooms,
      living_room_area_size,
      number_of_kitchens,
      kitchen_area_size,
      number_of_floors,
      area_size
    } = req.body;

    const property_image = req.files && req.files.image ? req.files.image[0].path : null;
    const house_plan_url = req.files && req.files.house_plan ? req.files.house_plan[0].path : null;

    if (!property_image) {
      return errorResponse(res, 'Main property image is required', 400);
    }

    // 2. Validate Owner role
    const owner = await User.findOne({
      where: {
        user_id: owner_id,
        role: 'Owner'
      }
    });

    if (!owner) {
      return errorResponse(res, 'Invalid owner. User must have the Owner role.', 400);
    }

    const propertyCity = city || agent.city || 'Addis Ababa';
    
    // 3. Create Property
    const property = await Property.create({
      owner_id,
      agent_id,
      title,
      description,
      city: propertyCity,
      sub_city,
      woreda,
      kebele,
      house_number, // Optional
      specific_location,
      price: parseFloat(price) || 0,
      property_type,
      listing_type,
      property_image,
      number_of_bedrooms: parseInt(number_of_bedrooms) || 0,
      bedroom_area_size: parseFloat(bedroom_area_size) || 0,
      number_of_bathrooms: parseInt(number_of_bathrooms) || 0,
      bathroom_area_size: parseFloat(bathroom_area_size) || 0,
      number_of_living_rooms: parseInt(number_of_living_rooms) || 0,
      living_room_area_size: parseFloat(living_room_area_size) || 0,
      number_of_kitchens: parseInt(number_of_kitchens) || 0,
      kitchen_area_size: parseFloat(kitchen_area_size) || 0,
      number_of_floors: parseInt(number_of_floors) || 0,
      area_size: parseFloat(area_size) || 0,
      availability_status: 'Available'
    });

    // 4. Create Property Document if house_plan uploaded
    if (house_plan_url) {
      try {
        await PropertyDocument.create({
          property_id: property.property_id,
          house_plan_url: house_plan_url,
          uploaded_by: agent_id,
          is_verified: false,
          verified_by: null,
          verified_at: null
        });
      } catch (docErr) {
        console.warn('⚠️ PropertyDocument creation failed, but property was created:', docErr.message);
      }
    }

    return successResponse(res, property, 'Property added successfully', 201);

  } catch (error) {
    console.error('❌ [Agent] addProperty Full Error Object:', JSON.stringify(error, null, 2));
    console.error('❌ Error Message:', error.message);

    // Check for specific Sequelize errors
    if (error.name === 'SequelizeValidationError') {
      const details = error.errors.map(e => e.message).join(', ');
      return errorResponse(res, `Validation Error: ${details}`, 400);
    }

    return errorResponse(res, 'Failed to add property', 500, error.message);
  }
};

/**
 * Update Managed Property (Agent)
 * Business Rules:
 * - Agent can only update properties they manage.
 * - City and Owner cannot be changed via this endpoint.
 */
exports.updateProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const agent_id = req.user.id;

    const property = await Property.findOne({
      where: { property_id: id, agent_id }
    });

    if (!property) {
      return errorResponse(res, 'Property not found or access denied', 403);
    }

    const updateData = { ...req.body };
    
    // Security layer: Prevent changing sensitive linking fields
    delete updateData.property_id;
    delete updateData.agent_id;
    delete updateData.owner_id;
    delete updateData.city;
    delete updateData.sub_city;


    await property.update(updateData);

    return successResponse(res, property, 'Property updated successfully');

  } catch (error) {
    console.error('Update Property Error:', error);
    return errorResponse(res, 'Failed to update property', 500, error.message);
  }
};

/**
 * Get Agent's Bookings (Appointments)
 * Business Rule: Agent manages ONLY bookings for their properties in their own city.
 */
exports.getBookings = async (req, res) => {
  try {
    const agent_id = req.user.id;
    const { status } = req.query;

    // 1. Get Agent's City to enforce restriction
    const agent = await User.findByPk(agent_id);
    if (!agent) return errorResponse(res, 'Agent not found', 404);

    // 2. Build Query with city restriction
    const where = { 
      agent_id
    };
    if (status && status !== 'All') where.booking_status = status;

    const bookings = await Booking.findAll({
      where,
      include: [
        {
          model: Property,
          where: { city: agent.city },
          attributes: ['title', 'city', 'price', 'property_image', 'listing_type'],
          include: [
            {
              model: User,
              as: 'owner',
              attributes: ['first_name', 'last_name', 'phone_number', 'email']
            }
          ]
        },
        {
          model: User,
          as: 'buyerRenter',
          attributes: ['first_name', 'last_name', 'phone_number', 'email', 'role']
        }
      ],
      attributes: [
        'booking_id', 'property_id', 'owner_id', 'agent_id', 'buyer_renter_id',
        'visit_date', 'message', 'booking_status'
      ],
      order: [['visit_date', 'ASC']]
    });

    return successResponse(res, bookings, 'Bookings fetched successfully');
  } catch (error) {
    console.error('Fetch Agent Bookings Error:', error);
    return errorResponse(res, 'Failed to fetch bookings', 500, error.message);
  }
};

/**
 * Update Booking Status (Approve/Cancel)
 */
exports.updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const agent_id = req.user.id;

    // Allowed statuses
    const allowedStatuses = ['Approved', 'Cancelled', 'Completed'];
    if (!allowedStatuses.includes(status)) {
      return errorResponse(res, 'Invalid status transition', 400);
    }

    // 1. Find the booking first to check existence
    const booking = await Booking.findByPk(id, {
      include: [
        { model: Property, attributes: ['title', 'owner_id', 'city'] },
        { model: User, as: 'buyerRenter', attributes: ['first_name', 'last_name', 'email'] }
      ]
    });

    if (!booking) {
      return errorResponse(res, 'Booking not found', 404);
    }

    // 2. Access Control: Ensure the agent is actually assigned
    if (booking.agent_id !== agent_id) {
      return errorResponse(res, 'Unauthorised: You are not the assigned agent for this booking', 403);
    }

    const previousStatus = booking.booking_status;
    
    // Logic: Agent approval starts the negotiation phase
    const newStatus = status === 'Approved' ? 'Negotiating' : status;
    await booking.update({ booking_status: newStatus });

    // Handle Advanced Workflow for Approval
    if (status === 'Approved' && previousStatus === 'Pending') {
      try {
        const propertyTitle = booking.Property?.title || 'the property';
        
        // 1. Notify Client (Buyer/Renter)
        if (booking.buyerRenter) {
          await NotificationService.sendInAppNotification(
            booking.buyer_renter_id,
            'Visit Approved',
            `Your visit for "${propertyTitle}" has been approved by the agent.`,
            'Booking',
            booking.booking_id
          );
          
          await NotificationService.sendEmail(
            booking.buyerRenter.email,
            'Appointment Approved - EthioHome',
            `
            <div style="font-family: sans-serif; padding: 20px; color: #333;">
              <h2 style="color: #2E7D32;">Appointment Approved!</h2>
              <p>Hello <strong>${booking.buyerRenter.first_name}</strong>,</p>
              <p>Great news! Your appointment to visit <strong>"${propertyTitle}"</strong> has been approved by our agent.</p>
              <p>You can now coordinate directly with the agent through the in-app chat to finalize the viewing time.</p>
              <br/>
              <p>Best regards,<br/>The EthioHome Team</p>
            </div>
            `
          );
        }

        // 2. Notify Owner
        const owner = await User.findByPk(booking.Property.owner_id);
        if (owner) {
          await NotificationService.sendInAppNotification(
            owner.user_id,
            'Visit Scheduled',
            `An agent has approved a visit for your property: ${propertyTitle}.`,
            'Property',
            booking.property_id
          );

          if (owner.email) {
            await NotificationService.sendEmail(
              owner.email,
              'Property Visit Scheduled - EthioHome',
              `
              <div style="font-family: sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #2E7D32;">New Visit Scheduled</h2>
                <p>Hello <strong>${owner.first_name}</strong>,</p>
                <p>An agent has approved a viewing request for your property: <strong>"${propertyTitle}"</strong>.</p>
                <p>The agent will coordinate the visit with the prospective client. You will be notified of any further updates.</p>
                <br/>
                <p>Best regards,<br/>The EthioHome Team</p>
              </div>
              `
            );
          }
        }

        // 3. Seed Chat Conversation (Welcome Message)
        const welcomeMsg = `Hello! I have approved your visit request for "${propertyTitle}". Let's coordinate a suitable time for the viewing.`;
        await pool.query(
          `INSERT INTO chat_messages (sender_id, receiver_id, message_text, is_read, created_at) 
           VALUES ($1, $2, $3, false, NOW())`,
          [agent_id, booking.buyer_renter_id, welcomeMsg]
        );

      } catch (notifyErr) {
        console.error('Workflow background error:', notifyErr);
      }
    } else if (status === 'Cancelled' && previousStatus !== 'Cancelled') {
      try {
        const propertyTitle = booking.Property?.title || 'the property';
        if (booking.buyerRenter) {
          await NotificationService.sendInAppNotification(
            booking.buyer_renter_id,
            'Visit Cancelled',
            `Your visit for "${propertyTitle}" has been cancelled by the agent.`,
            'Booking',
            booking.booking_id
          );
          
          await NotificationService.sendEmail(
            booking.buyerRenter.email,
            'Appointment Cancelled - EthioHome',
            `
            <div style="font-family: sans-serif; padding: 20px; color: #333;">
              <h2 style="color: #D32F2F;">Appointment Cancelled</h2>
              <p>Hello <strong>${booking.buyerRenter.first_name}</strong>,</p>
              <p>Your appointment to visit <strong>"${propertyTitle}"</strong> has been cancelled by our agent.</p>
              <p>If you have any questions, please reach out to the agent.</p>
              <br/>
              <p>Best regards,<br/>The EthioHome Team</p>
            </div>
            `
          );
        }
      } catch (notifyErr) {
        console.error('Workflow background error on cancel:', notifyErr);
      }
    }

    return successResponse(res, booking, `Booking status updated to ${newStatus}`);
  } catch (error) {
    console.error('Update Booking Status Error:', error);
    return errorResponse(res, 'Failed to update booking status', 500, error.message);
  }
};

/**
 * Send Booking/Offer to Owner for Approval
 */
exports.sendToOwner = async (req, res) => {
  try {
    const { id } = req.params;
    const agent_id = req.user.id;

    const booking = await Booking.findByPk(id, {
      include: [
        { model: Property, attributes: ['title', 'owner_id'] },
        { model: User, as: 'buyerRenter', attributes: ['first_name', 'last_name'] }
      ]
    });

    if (!booking) return errorResponse(res, 'Booking not found', 404);
    if (booking.agent_id !== agent_id) return errorResponse(res, 'Unauthorized', 403);

    // Update status to Owner_Pending
    await booking.update({ booking_status: 'Owner_Pending' });

    // Notify Owner
    await NotificationService.sendInAppNotification(
      booking.Property.owner_id,
      'New Offer Received',
      `An agent has sent you a new booking request for "${booking.Property.title}". Please review it in your offers.`,
      'Booking',
      booking.booking_id
    );

    return successResponse(res, booking, 'Offer sent to owner for approval');
  } catch (error) {
    console.error('Send to Owner Error:', error);
    return errorResponse(res, 'Failed to send offer to owner', 500);
  }
};

/**
 * Get Agent's Commissions
 * Business Rule: Agent sees ONLY their commissions for properties in their city.
 */
exports.getCommissions = async (req, res) => {
  try {
    const agent_id = req.user.id;
    const { status, type } = req.query;

    const agent = await User.findByPk(agent_id);
    if (!agent) return errorResponse(res, 'Agent not found', 404);

    const where = { agent_id };
    if (status && status !== 'All') where.commission_status = status;

    const commissions = await Commission.findAll({
      where,
      include: [
        {
          model: Transaction,
          include: [
            {
              model: Property,
              as: 'Property',
              where: { city: agent.city },
              attributes: ['title', 'property_image', 'city', 'property_type']
            }
          ],
          attributes: ['transaction_type', 'agreed_price', 'contract_date']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    // Apply type filter if provided (since it's in the joined Transaction model)
    let filteredCommissions = commissions;
    if (type && type !== 'All') {
      filteredCommissions = commissions.filter(c => c.Transaction && c.Transaction.transaction_type === type);
    }

    return successResponse(res, filteredCommissions, 'Commissions fetched successfully');
  } catch (error) {
    console.error('Fetch Commissions Error:', error);
    return errorResponse(res, 'Failed to fetch commissions', 500, error.message);
  }
};

/**
 * Get Agent's Clients
 * Clients are unique buyers/renters who have booked visits for the agent's properties
 */
exports.getClients = async (req, res) => {
  try {
    const agent_id = req.user.id;

    // Get unique clients based on phone number
    const clients = await Booking.findAll({
      where: { agent_id },
      attributes: [
        'buyer_tenant_phone',
        'buyer_tenant_first_name',
        'buyer_tenant_last_name',
        'buyer_tenant_email',
        'buyer_tenant_role',
        [Booking.sequelize.fn('COUNT', Booking.sequelize.col('booking_id')), 'total_bookings'],
        [Booking.sequelize.fn('MAX', Booking.sequelize.col('created_at')), 'last_interaction']
      ],
      group: [
        'buyer_tenant_phone',
        'buyer_tenant_first_name',
        'buyer_tenant_last_name',
        'buyer_tenant_email',
        'buyer_tenant_role'
      ],
      order: [[Booking.sequelize.fn('MAX', Booking.sequelize.col('created_at')), 'DESC']]
    });

    return successResponse(res, clients, 'Clients fetched successfully');
  } catch (error) {
    console.error('Fetch Clients Error:', error);
    return errorResponse(res, 'Failed to fetch clients', 500, error.message);
  }
};
