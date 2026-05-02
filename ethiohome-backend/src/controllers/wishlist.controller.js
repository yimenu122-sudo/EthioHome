const { Wishlist, Property, PropertyImage } = require('../models/associations');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * Add a property to user's wishlist
 */
exports.addToWishlist = async (req, res) => {
  try {
    const { property_id } = req.body;
    const user_id = req.user.id;

    // Check if already in wishlist
    const existing = await Wishlist.findOne({ where: { user_id, property_id } });
    if (existing) {
      return errorResponse(res, 'Property already in wishlist', 400);
    }

    const wishlistItem = await Wishlist.create({ user_id, property_id });
    return successResponse(res, wishlistItem, 'Property added to wishlist', 201);
  } catch (error) {
    console.error('Add to Wishlist Error:', error);
    return errorResponse(res, 'Failed to add to wishlist', 500);
  }
};

/**
 * Get user's wishlist
 */
exports.getWishlist = async (req, res) => {
  try {
    const user_id = req.user.id;
    const wishlist = await Wishlist.findAll({
      where: { user_id },
      include: [
        {
          model: Property,
          as: 'property',
          include: [{ model: PropertyImage, as: 'images', limit: 1 }]
        }
      ],
      order: [['created_at', 'DESC']]
    });

    return successResponse(res, wishlist, 'Wishlist fetched successfully');
  } catch (error) {
    console.error('Get Wishlist Error:', error);
    return errorResponse(res, 'Failed to fetch wishlist', 500);
  }
};

/**
 * Remove a property from wishlist
 */
exports.removeFromWishlist = async (req, res) => {
  try {
    const { property_id } = req.params;
    const user_id = req.user.id;

    const deleted = await Wishlist.destroy({ where: { user_id, property_id } });
    if (!deleted) {
      return errorResponse(res, 'Property not found in wishlist', 404);
    }

    return successResponse(res, null, 'Property removed from wishlist');
  } catch (error) {
    console.error('Remove from Wishlist Error:', error);
    return errorResponse(res, 'Failed to remove from wishlist', 500);
  }
};
