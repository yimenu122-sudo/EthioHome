/**
 * @file owner.controller.js
 * @description Owner Module Controller – EthioHome Production System
 *
 * Endpoints:
 *  - getDashboardStats       GET  /api/owner/dashboard
 *  - getProperties           GET  /api/owner/properties
 *  - updatePropertyStatus   PATCH /api/owner/properties/:id/status
 *  - assignAgentToProperty  POST  /api/owner/properties/:id/assign-agent
 *  - uploadPropertyImages   POST  /api/owner/properties/:id/images
 *  - deletePropertyImage   DELETE /api/owner/properties/:id/images/:imageId
 */

const { Property, Booking, Commission, Transaction, User, PropertyImage } = require('../models/associations');
const SystemSetting = require('../models/system_setting.model');
const { successResponse, errorResponse } = require('../utils/response');
const { Op, Sequelize } = require('sequelize');
const cloudinary = require('../config/cloudinary');

// ─────────────────────────────────────────────────────────────────────────────
// 1. GET OWNER DASHBOARD STATS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route   GET /api/owner/dashboard
 * @desc    Property stats, commission summary, recent bookings & transactions
 * @access  Private (Owner Only)
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const owner_id = req.user.id;

    // 1a. Property status breakdown
    const propertyStats = await Property.findAll({
      where: { owner_id },
      attributes: [
        'availability_status',
        [Sequelize.fn('COUNT', Sequelize.col('property_id')), 'count'],
      ],
      group: ['availability_status'],
      raw: true, // Use raw for simple aggregation to avoid getDataValue issues
    });

    const stats = { total: 0, available: 0, rented: 0, sold: 0, unavailable: 0 };
    propertyStats.forEach((stat) => {
      const status = stat.availability_status;
      const count  = parseInt(stat.count);
      stats.total += count;
      if (status === 'Available')   stats.available   = count;
      if (status === 'Rented')      stats.rented      = count;
      if (status === 'Sold')        stats.sold        = count;
      if (status === 'Unavailable') stats.unavailable = count;
    });

    // 1b. Commission summary from completed transactions
    const transactions = await Transaction.findAll({
      where: { owner_id, transaction_status: 'Completed' },
      attributes: ['transaction_type', 'agreed_price'],
    });

    let totalCommissionToPay = 0;
    transactions.forEach((t) => {
      const price = parseFloat(t.agreed_price);
      if (t.transaction_type === 'Sale') totalCommissionToPay += price * 0.02;
      if (t.transaction_type === 'Rent') totalCommissionToPay += price * 0.09;
    });

    // 1c. Recent bookings
    const recentBookings = await Booking.findAll({
      where: { owner_id },
      limit: 5,
      order: [['created_at', 'DESC']], 
      include: [
        { model: Property, attributes: ['title'] },
        { model: User, as: 'buyerRenter', attributes: ['first_name', 'last_name', 'phone_number'] }
      ],
    });

    // 1d. Recent transactions
    const recentTransactions = await Transaction.findAll({
      where: { owner_id },
      limit: 5,
      order: [['created_at', 'DESC']],
      include: [{ model: Property, attributes: ['title'] }],
    });

    return successResponse(res, {
      stats: { ...stats, totalCommissionToPay: parseFloat(totalCommissionToPay.toFixed(2)) },
      recentActivities: { bookings: recentBookings, transactions: recentTransactions },
    }, 'Owner dashboard stats fetched successfully');

  } catch (error) {
    console.error('[Owner] getDashboardStats Error:', error);
    return errorResponse(res, 'Failed to fetch dashboard stats', 500, error.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. GET OWNER PROPERTIES (with images)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route   GET /api/owner/properties
 * @desc    Owner's properties with agent info and all images
 * @access  Private (Owner Only)
 */
exports.getProperties = async (req, res) => {
  try {
    const owner_id = req.user.id;
    const { status, type, search, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = { owner_id };
    if (status && status !== 'All') where.availability_status = status;
    if (type   && type   !== 'All') where.listing_type        = type;
    if (search) {
      where[Op.or] = [
        { title:        { [Op.iLike]: `%${search}%` } },
        { sub_city:     { [Op.iLike]: `%${search}%` } },
        { city:         { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows: properties } = await Property.findAndCountAll({
      where,
      limit:  parseInt(limit),
      offset,
      order:  [['created_at', 'DESC']],
      include: [
        {
          model:      User,
          as:         'agent',
          attributes: ['first_name', 'last_name', 'phone_number', 'city', 'profile_image'],
          required:   false,
        },
        {
          model:      PropertyImage,
          as:         'images',
          attributes: ['image_id', 'image_url', 'is_primary', 'display_order'],
          required:   false,
          order:      [['display_order', 'ASC']],
        },
      ],
    });

    return successResponse(res, {
      properties,
      pagination: {
        totalItems:  count,
        totalPages:  Math.ceil(count / parseInt(limit)),
        currentPage: parseInt(page),
        limit:       parseInt(limit),
      },
    }, 'Owner properties fetched successfully');

  } catch (error) {
    console.error('[Owner] getProperties Error:', error);
    return errorResponse(res, 'Failed to fetch properties', 500, error.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. UPDATE PROPERTY STATUS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route   PATCH /api/owner/properties/:id/status
 * @desc    Update property availability_status (Available / Rented / Sold / Unavailable)
 * @access  Private (Owner Only)
 * @body    { status: 'Available' | 'Rented' | 'Sold' | 'Unavailable' }
 */
exports.updatePropertyStatus = async (req, res) => {
  try {
    const owner_id    = req.user.id;
    const property_id = req.params.id;
    const { status }  = req.body;

    const VALID_STATUSES = ['Available', 'Rented', 'Sold', 'Unavailable'];
    if (!status || !VALID_STATUSES.includes(status)) {
      return errorResponse(
        res,
        `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
        400
      );
    }

    // Verify property belongs to this owner
    const property = await Property.findOne({ where: { property_id, owner_id } });
    if (!property) {
      return errorResponse(res, 'Property not found or access denied', 404);
    }

    const previousStatus = property.availability_status;

    await property.update({ availability_status: status });

    return successResponse(res, {
      property_id,
      previous_status: previousStatus,
      new_status:      status,
    }, `Property status updated to "${status}" successfully`);

  } catch (error) {
    console.error('[Owner] updatePropertyStatus Error:', error);
    return errorResponse(res, 'Failed to update property status', 500, error.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. ASSIGN AGENT AUTOMATICALLY (City-Based)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route   POST /api/owner/properties/:id/assign-agent
 * @desc    Auto-assign a city-matching Active Agent to the property.
 *          Owner CANNOT manually choose — system selects by city logic.
 * @access  Private (Owner Only)
 */
exports.assignAgentToProperty = async (req, res) => {
  try {
    const owner_id    = req.user.id;
    const property_id = req.params.id;

    // 1. Verify property belongs to owner
    const property = await Property.findOne({
      where: { property_id, owner_id },
      include: [{ model: User, as: 'agent', attributes: ['first_name', 'last_name', 'city'] }],
    });

    if (!property) {
      return errorResponse(res, 'Property not found or access denied', 404);
    }

    // 2. City-based agent lookup (Robust match: trim and case-insensitive)
    const availableAgent = await User.findOne({
      where: {
        role:   'Agent',
        status: 'Active',
        [Op.and]: [
          Sequelize.where(
            Sequelize.fn('TRIM', Sequelize.col('city')),
            { [Op.iLike]: property.city.trim() }
          )
        ]
      },
      attributes: ['user_id', 'first_name', 'last_name', 'phone_number', 'city'],
      order: [['created_at', 'ASC']], // FIFO: earliest active agent in city
    });

    if (!availableAgent) {
      return errorResponse(
        res,
        `No active agent available in ${property.city}. Please try again later.`,
        404
      );
    }

    // 3. Assign agent to property
    await property.update({ agent_id: availableAgent.user_id });

    return successResponse(res, {
      property_id,
      property_city: property.city,
      assigned_agent: {
        agent_id:    availableAgent.user_id,
        name:        `${availableAgent.first_name} ${availableAgent.last_name}`,
        phone:       availableAgent.phone_number,
        city:        availableAgent.city,
      },
    }, `Agent "${availableAgent.first_name} ${availableAgent.last_name}" has been auto-assigned based on city: ${property.city}`);

  } catch (error) {
    console.error('[Owner] assignAgentToProperty Error:', error);
    return errorResponse(res, 'Failed to assign agent', 500, error.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. UPLOAD MULTIPLE PROPERTY IMAGES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route   POST /api/owner/properties/:id/images
 * @desc    Upload multiple images for a property (max 8, via Cloudinary/Multer)
 * @access  Private (Owner Only)
 * @body    multipart/form-data { images: File[] }
 */
exports.uploadPropertyImages = async (req, res) => {
  try {
    const owner_id    = req.user.id;
    const property_id = req.params.id;

    // 1. Verify property ownership
    const property = await Property.findOne({ where: { property_id, owner_id } });
    if (!property) {
      return errorResponse(res, 'Property not found or access denied', 404);
    }

    // 2. Validate files exist (set by Multer middleware)
    if (!req.files || req.files.length === 0) {
      return errorResponse(res, 'No images provided. Please upload at least one image.', 400);
    }

    // 3. Check existing image count (max 8 total)
    const existingCount = await PropertyImage.count({ where: { property_id } });
    if (existingCount + req.files.length > 8) {
      return errorResponse(
        res,
        `This property already has ${existingCount} image(s). Maximum 8 images allowed. You can upload ${8 - existingCount} more.`,
        400
      );
    }

    // 4. Build image records from Cloudinary upload results
    const isFirstUpload = existingCount === 0;
    const imageRecords = req.files.map((file, index) => ({
      property_id,
      image_url:       file.path,         // Cloudinary URL (set by multer-storage-cloudinary)
      image_public_id: file.filename,     // Cloudinary public_id for deletion
      is_primary:      isFirstUpload && index === 0,  // First image of first upload = primary
      display_order:   existingCount + index + 1,
      uploaded_by:     owner_id,
    }));

    // 5. Bulk insert images
    const savedImages = await PropertyImage.bulkCreate(imageRecords, { returning: true });

    // 6. If this is the first image, also update the legacy property_image field
    if (isFirstUpload && savedImages.length > 0) {
      await property.update({ property_image: savedImages[0].image_url });
    }

    return successResponse(
      res,
      {
        property_id,
        uploaded_count: savedImages.length,
        images: savedImages.map((img) => ({
          image_id:      img.image_id,
          image_url:     img.image_url,
          is_primary:    img.is_primary,
          display_order: img.display_order,
        })),
      },
      `${savedImages.length} image(s) uploaded successfully`,
      201
    );

  } catch (error) {
    console.error('[Owner] uploadPropertyImages Error:', error);
    return errorResponse(res, 'Failed to upload images', 500, error.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. DELETE A PROPERTY IMAGE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route   DELETE /api/owner/properties/:id/images/:imageId
 * @desc    Remove a specific image from a property (also deletes from Cloudinary)
 * @access  Private (Owner Only)
 */
exports.deletePropertyImage = async (req, res) => {
  try {
    const owner_id    = req.user.id;
    const property_id = req.params.id;
    const image_id    = req.params.imageId;

    // 1. Verify property ownership
    const property = await Property.findOne({ where: { property_id, owner_id } });
    if (!property) {
      return errorResponse(res, 'Property not found or access denied', 404);
    }

    // 2. Find the image
    const image = await PropertyImage.findOne({ where: { image_id, property_id } });
    if (!image) {
      return errorResponse(res, 'Image not found', 404);
    }

    const wasPrimary = image.is_primary;

    // 3. Delete from Cloudinary (if public_id exists)
    if (image.image_public_id) {
      try {
        await cloudinary.uploader.destroy(image.image_public_id);
      } catch (cloudinaryErr) {
        console.warn('[Owner] Cloudinary delete warning:', cloudinaryErr.message);
        // Non-fatal: still delete DB record
      }
    }

    // 4. Delete from DB
    await image.destroy();

    // 5. If deleted image was primary, promote the next image
    if (wasPrimary) {
      const nextImage = await PropertyImage.findOne({
        where: { property_id },
        order: [['display_order', 'ASC']],
      });
      if (nextImage) {
        await nextImage.update({ is_primary: true });
        await property.update({ property_image: nextImage.image_url });
      }
    }

    return successResponse(res, { image_id, property_id }, 'Image deleted successfully');

  } catch (error) {
    console.error('[Owner] deletePropertyImage Error:', error);
    return errorResponse(res, 'Failed to delete image', 500, error.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 7. SET PRIMARY IMAGE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route   PATCH /api/owner/properties/:id/images/:imageId/set-primary
 * @desc    Set a specific image as the primary/cover image
 * @access  Private (Owner Only)
 */
exports.setPrimaryImage = async (req, res) => {
  try {
    const owner_id    = req.user.id;
    const property_id = req.params.id;
    const image_id    = req.params.imageId;

    // Verify ownership
    const property = await Property.findOne({ where: { property_id, owner_id } });
    if (!property) return errorResponse(res, 'Property not found or access denied', 404);

    // Find and verify image
    const image = await PropertyImage.findOne({ where: { image_id, property_id } });
    if (!image) return errorResponse(res, 'Image not found', 404);

    // Unset all primary flags for this property
    await PropertyImage.update({ is_primary: false }, { where: { property_id } });

    // Set new primary
    await image.update({ is_primary: true });

    // Sync legacy field
    await property.update({ property_image: image.image_url });

    return successResponse(res, { image_id, image_url: image.image_url }, 'Primary image updated successfully');

  } catch (error) {
    console.error('[Owner] setPrimaryImage Error:', error);
    return errorResponse(res, 'Failed to set primary image', 500, error.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 8. ADD NEW PROPERTY (OWNER)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route   POST /api/owner/properties
 * @desc    Create a new property listing
 * @access  Private (Owner)
 */
exports.addProperty = async (req, res) => {
  try {
    const owner_id = req.user.id;
    
    // 1. Get Owner's profile to get their city
    const owner = await User.findByPk(owner_id);
    if (!owner) return errorResponse(res, 'Owner not found', 404);

    const {
      title,
      description,
      listing_type,
      property_type,
      sub_city,
      woreda,
      kebele,
      specific_location,
      price,
      number_of_bedrooms,
      number_of_bathrooms,
      number_of_living_rooms,
      number_of_kitchens,
      number_of_floors,
      area_size,
    } = req.body;

    // Strict Backend Validation
    const requiredFields = ['title', 'description', 'listing_type', 'property_type', 'sub_city', 'specific_location', 'price'];
    const missingFields = requiredFields.filter(field => !req.body[field]);

    if (missingFields.length > 0) {
      return errorResponse(res, `Missing required fields: ${missingFields.join(', ')}`, 400);
    }

    const property_image = req.file ? req.file.path : null;

    if (!property_image) {
      return errorResponse(res, 'Main property image is required', 400);
    }

    const city = owner.city || 'Addis Ababa';

    // 2. Auto-assign Agent (least assigned properties in the same city)
    const agents = await User.findAll({
      where: {
        role: 'Agent',
        status: 'Active',
        [Op.and]: [
          Sequelize.where(
            Sequelize.fn('TRIM', Sequelize.col('city')),
            { [Op.iLike]: city.trim() }
          )
        ]
      },
      attributes: ['user_id']
    });

    let agent_id = null;
    if (agents.length > 0) {
      let minCount = Infinity;
      for (const agent of agents) {
        const count = await Property.count({ where: { agent_id: agent.user_id } });
        if (count < minCount) {
          minCount = count;
          agent_id = agent.user_id;
        }
      }
    }

    // 3. Create Property
    const property = await Property.create({
      owner_id,
      agent_id,
      title,
      description,
      listing_type,
      property_type,
      city,
      sub_city,
      woreda,
      kebele,
      specific_location,
      price: parseFloat(price) || 0,
      number_of_bedrooms: parseInt(number_of_bedrooms) || 0,
      number_of_bathrooms: parseInt(number_of_bathrooms) || 0,
      number_of_living_rooms: parseInt(number_of_living_rooms) || 0,
      number_of_kitchens: parseInt(number_of_kitchens) || 0,
      number_of_floors: parseInt(number_of_floors) || 0,
      area_size: parseFloat(area_size) || 0,
      property_image,
      availability_status: 'Unavailable', // Always Unavailable until approved/active
    });

    return successResponse(res, {
      property,
      moderation_pending: true
    }, 'Property listed successfully and is pending approval', 201);

  } catch (error) {
    console.error('[Owner] addProperty Error:', error);
    return errorResponse(res, 'Failed to create listing', 500, error.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 9. GET OWNER PROFILE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route   GET /api/owner/profile
 * @desc    Get complete profile for current owner
 * @access  Private (Owner)
 */
exports.getProfile = async (req, res) => {
  try {
    const user_id = req.user.id;
    const user = await User.findByPk(user_id, {
      attributes: ['user_id', 'first_name', 'last_name', 'email', 'phone_number', 'city', 'profile_image', 'is_verified', 'national_id', 'status']
    });

    if (!user) return errorResponse(res, 'User not found', 404);

    // Mask national ID for security if needed
    const profileData = user.toJSON();
    if (profileData.national_id) {
       profileData.national_id_masked = `********${profileData.national_id.slice(-4)}`;
    }

    return successResponse(res, profileData, 'Profile fetched successfully');
  } catch (error) {
    console.error('[Owner] getProfile Error:', error);
    return errorResponse(res, 'Failed to fetch profile', 500);
  }
};

/**
 * @route   PATCH /api/owner/profile
 * @desc    Update owner profile info
 * @access  Private (Owner)
 */
exports.updateProfile = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { first_name, last_name, email, phone_number } = req.body;

    const user = await User.findByPk(user_id);
    if (!user) return errorResponse(res, 'User not found', 404);

    // Business Rule: Update allowed fields
    if (first_name) user.first_name = first_name;
    if (last_name)  user.last_name  = last_name;
    if (email)      user.email      = email;
    if (phone_number) user.phone_number = phone_number; 

    // Note: If phone_number changes, in a real production system we'd trigger OTP here
    // For now we allow the update for the owner's convenience.

    await user.save();

    return successResponse(res, user, 'Profile updated successfully');
  } catch (error) {
    console.error('[Owner] updateProfile Error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
       return errorResponse(res, 'Phone number or Email already in use', 400);
    }
    return errorResponse(res, 'Failed to update profile', 500, error.message);
  }
};

/**
 * @route   POST /api/owner/profile/image
 * @desc    Upload or update owner profile picture
 * @access  Private (Owner)
 */
exports.uploadProfileImage = async (req, res) => {
  try {
    const user_id = req.user.id;
    
    if (!req.file) {
      return errorResponse(res, 'No image file provided', 400);
    }

    const user = await User.findByPk(user_id);
    if (!user) return errorResponse(res, 'User not found', 404);

    // Image URL from Cloudinary (handled by middleware)
    user.profile_image = req.file.path; 
    await user.save();

    return successResponse(res, { profile_image: user.profile_image }, 'Profile image updated successfully');
  } catch (error) {
    console.error('[Owner] uploadProfileImage Error:', error);
    return errorResponse(res, 'Failed to upload image', 500);
  }
};

/**
 * @route   PUT /api/owner/profile/change-password
 * @desc    Change authenticated owner password
 * @access  Private (Owner)
 */
exports.changePassword = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return errorResponse(res, 'Current and new password are required', 400);
    }

    const user = await User.findByPk(user_id);
    if (!user) return errorResponse(res, 'User not found', 404);

    // Verify current password
    const bcrypt = require('bcrypt');
    const isValid = await bcrypt.compare(current_password, user.password_hash);
    if (!isValid) return errorResponse(res, 'Invalid current password', 400);

    // Hash new password
    user.password_hash = await bcrypt.hash(new_password, 10);
    await user.save();

    return successResponse(res, null, 'Password changed successfully');
  } catch (error) {
    console.error('[Owner] changePassword Error:', error);
    return errorResponse(res, 'Failed to change password', 500);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 10. GET SPECIFIC PROPERTY DETAILS (OWNER)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route   GET /api/owner/properties/:id
 * @desc    Fetch a single property with images and agent info
 * @access  Private (Owner Only)
 */
exports.getPropertyDetails = async (req, res) => {
  try {
    const owner_id = req.user.id;
    const { id }   = req.params;

    const property = await Property.findOne({
      where: { property_id: id, owner_id },
      include: [
        {
          model:      User,
          as:         'agent',
          attributes: ['first_name', 'last_name', 'phone_number', 'city', 'profile_image'],
          required:   false,
        },
        {
          model:      PropertyImage,
          as:         'images',
          attributes: ['image_id', 'image_url', 'is_primary', 'display_order'],
          required:   false,
        },
      ],
      order: [[ { model: PropertyImage, as: 'images' }, 'display_order', 'ASC' ]]
    });

    if (!property) {
      return errorResponse(res, 'Property not found or access denied', 404);
    }

    // Check for active bookings or transactions to inform the frontend
    const bookingCount = await Booking.count({ where: { property_id: id, booking_status: 'Pending' } });
    const transactionCount = await Transaction.count({ where: { property_id: id, transaction_status: 'Completed' } });

    return successResponse(res, {
      property,
      metadata: {
        has_pending_bookings: bookingCount > 0,
        is_sold_rented: transactionCount > 0
      }
    }, 'Property details fetched successfully');

  } catch (error) {
    console.error('[Owner] getPropertyDetails Error:', error);
    return errorResponse(res, 'Failed to fetch property details', 500, error.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 11. UPDATE PROPERTY DETAILS (OWNER)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route   PUT /api/owner/properties/:id
 * @desc    Update property info (Security: check ownership, no edit if sold/rented)
 * @access  Private (Owner Only)
 */
exports.updateProperty = async (req, res) => {
  try {
    const owner_id = req.user.id;
    const { id }   = req.params;

    // 1. Find and Verify property
    const property = await Property.findOne({ where: { property_id: id, owner_id } });
    if (!property) {
      return errorResponse(res, 'Property not found or access denied', 404);
    }

    // 2. Business Rule: Cannot edit if transaction completed
    const transactionCount = await Transaction.count({ where: { property_id: id, transaction_status: 'Completed' } });
    if (transactionCount > 0) {
      return errorResponse(res, 'This property is already sold/rented and cannot be edited.', 403);
    }

    // 3. Business Rule: If bookings exist, warn or restrict (Handled on frontend, but enforced here)
    const bookingCount = await Booking.count({ where: { property_id: id, booking_status: 'Pending' } });
    
    // 4. Build Update Object (Sanitize)
    const updateData = { ...req.body };
    
    // SECURITY: Prevent tampering with locked fields
    delete updateData.property_id;
    delete updateData.owner_id;
    delete updateData.agent_id;
    delete updateData.city;         // READ-ONLY
    delete updateData.created_at;
    delete updateData.updated_at;

    // If bookings exist, restrict price or type change if needed (Policy dependant)
    if (bookingCount > 0) {
      // For now, allow but maybe log a warning or restrict listing_type
      // delete updateData.listing_type; 
    }

    // 5. Update
    await property.update(updateData);

    return successResponse(res, property, 'Property updated successfully');

  } catch (error) {
    console.error('[Owner] updateProperty Error:', error);
    return errorResponse(res, 'Failed to update property', 500, error.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 12. GET OFFERS (PENDING BOOKINGS)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route   GET /api/owner/offers
 * @desc    Fetch all pending booking requests for owner properties
 * @access  Private (Owner Only)
 */
exports.getOffers = async (req, res) => {
  try {
    const owner_id = req.user.id;
    const { status = 'Pending' } = req.query;

    const offers = await Booking.findAll({
      where: { owner_id, booking_status: status },
      include: [
        {
          model: Property,
          attributes: ['title', 'property_image', 'price', 'listing_type', 'city', 'sub_city', 'agent_id', 'property_id']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    return successResponse(res, offers, 'Offers fetched successfully');
  } catch (error) {
    console.error('[Owner] getOffers Error:', error);
    return errorResponse(res, 'Failed to fetch offers', 500, error.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 13. APPROVE OFFER (CREATE TRANSACTION & COMMISSION)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route   POST /api/owner/offers/:id/approve
 * @desc    Approve a booking, create transaction record, create commission, and update property status
 * @access  Private (Owner Only)
 */
exports.approveOffer = async (req, res) => {
  const t = await Sequelize.transaction(); // Ensure atomicity
  try {
    const owner_id = req.user.id;
    const booking_id = req.params.id;

    // 1. Find the booking
    const booking = await Booking.findOne({
      where: { booking_id, owner_id },
      include: [{ model: Property }]
    });

    if (!booking) {
      if (!t.finished) await t.rollback();
      return errorResponse(res, 'Offer not found or access denied', 404);
    }

    if (booking.booking_status !== 'Pending') {
      if (!t.finished) await t.rollback();
      return errorResponse(res, 'This offer has already been processed', 400);
    }

    const property = booking.Property;
    const agreed_price = property.price; // Default to listing price
    const transaction_type = property.listing_type;

    // 4. Get Commission Rates from System Settings
    const commissionSetting = await SystemSetting.findOne({ where: { key: 'rent_sale_split' } });
    const rates = commissionSetting ? commissionSetting.value : { rent: 9, sale: 2 };
    
    // 5. Calculate Commission
    let commissionAmount = 0;
    if (transaction_type === 'Sale') {
      commissionAmount = agreed_price * (rates.sale / 100);
    } else {
      commissionAmount = agreed_price * (rates.rent / 100);
    }

    // 6. Update Booking Status
    await booking.update({ booking_status: 'Approved' }, { transaction: t });

    // 7. Create Transaction
    const transaction = await Transaction.create({
      property_id: property.property_id,
      booking_id: booking.booking_id,
      owner_id,
      agent_id: property.agent_id,
      transaction_type,
      agreed_price,
      contract_date: new Date(),
      transaction_status: 'Completed'
    }, { transaction: t });

    // 8. Create Commission Record
    if (property.agent_id) {
       await Commission.create({
          transaction_id: transaction.transaction_id,
          booking_id: booking.booking_id,
          owner_id,
          agent_id: property.agent_id,
          amount: commissionAmount,
          commission_status: 'Pending'
       }, { transaction: t });
    }

    // 9. Update Property Status
    const newStatus = transaction_type === 'Sale' ? 'Sold' : 'Rented';
    await property.update({ availability_status: newStatus }, { transaction: t });

    await t.commit();

    return successResponse(res, {
      transaction_id: transaction.transaction_id,
      new_property_status: newStatus,
      commission_calculated: commissionAmount
    }, `Offer approved! Property is now marked as ${newStatus}.`);

  } catch (error) {
    if (t && !t.finished) await t.rollback();
    console.error('[Owner] approveOffer Error:', error);
    return errorResponse(res, 'Failed to approve offer', 500, error.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 14. REJECT OFFER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route   POST /api/owner/offers/:id/reject
 * @desc    Reject a booking request
 * @access  Private (Owner Only)
 */
exports.rejectOffer = async (req, res) => {
  try {
    const owner_id = req.user.id;
    const booking_id = req.params.id;

    const booking = await Booking.findOne({ where: { booking_id, owner_id } });
    if (!booking) return errorResponse(res, 'Offer not found', 404);

    if (booking.booking_status !== 'Pending') {
      return errorResponse(res, 'This offer has already been processed', 400);
    }

    await booking.update({ booking_status: 'Cancelled' });

    return successResponse(res, null, 'Offer rejected successfully');
  } catch (error) {
    console.error('[Owner] rejectOffer Error:', error);
    return errorResponse(res, 'Failed to reject offer', 500);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 15. GET COMMISSIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route   GET /api/owner/commissions
 * @desc    Get all commission records (pending/paid) for the owner
 * @access  Private (Owner Only)
 */
exports.getCommissions = async (req, res) => {
  try {
    const owner_id = req.user.id;
    const { status } = req.query;

    const where = { owner_id };
    if (status) where.commission_status = status;

    const commissions = await Commission.findAll({
      where,
      include: [
        {
          model: Transaction,
          attributes: ['transaction_id', 'agreed_price', 'transaction_type', 'contract_date'],
          include: [{ model: Property, attributes: ['property_id', 'title', 'city', 'sub_city', 'property_image'] }]
        },
        {
          model: User,
          as: 'agent',
          attributes: ['user_id', 'first_name', 'last_name', 'phone_number']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    // Fetch rates to show on UI if needed
    const commissionSetting = await SystemSetting.findOne({ where: { key: 'rent_sale_split' } });
    const rates = commissionSetting ? commissionSetting.value : { rent: 9, sale: 2 };

    return successResponse(res, { commissions, rates }, 'Commissions fetched successfully');
  } catch (error) {
    console.error('[Owner] getCommissions Error:', error);
    return errorResponse(res, 'Failed to fetch commissions', 500, error.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 16. PAY COMMISSION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route   POST /api/owner/commissions/:id/pay
 * @desc    Simulate/Record a commission payment
 * @access  Private (Owner Only)
 * @body    { payment_method: 'Tele Birr' | 'Bank' | 'Mobile Money' | 'Cash' }
 */
exports.payCommission = async (req, res) => {
  const t = await Sequelize.transaction();
  try {
    const owner_id = req.user.id;
    const commission_id = req.params.id;
    const { payment_method } = req.body;

    if (!payment_method) {
      await t.rollback();
      return errorResponse(res, 'Payment method is required', 400);
    }

    // 1. Verify Commission
    const commission = await Commission.findOne({
      where: { commission_id, owner_id }
    });

    if (!commission) {
      await t.rollback();
      return errorResponse(res, 'Commission record not found', 404);
    }

    if (commission.commission_status === 'Completed') {
      await t.rollback();
      return errorResponse(res, 'This commission is already paid.', 400);
    }

    // 2. Create Payment Record (Set to Processing or Completed for simulation)
    const payment = await Payment.create({
      transaction_id: commission.transaction_id,
      amount: commission.amount,
      payment_method,
      payment_status: 'Completed', // For production, this would be 'Processing' until webhook/confirmation
      payment_date: new Date()
    }, { transaction: t });

    // 3. Update Commission Status
    await commission.update({ commission_status: 'Completed' }, { transaction: t });

    // 4. Notify Agent
    const Notification = require('../models/notification.model'); // Ensure imported if needed
    await Notification.create({
       user_id: commission.agent_id,
       booking_id: commission.booking_id,
       title: 'Commission Paid',
       message: `The owner has paid the commission for your recent transaction.`,
       created_at: new Date()
    }, { transaction: t });

    await t.commit();

    return successResponse(res, { payment, commission_id }, 'Commission paid successfully. Notification sent to agent.');

  } catch (error) {
    if (t && !t.finished) await t.rollback();
    console.error('[Owner] payCommission Error:', error);
    return errorResponse(res, 'Failed to process payment', 500, error.message);
  }
};

