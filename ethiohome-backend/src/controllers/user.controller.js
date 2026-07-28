/**
 * @file user.controller.js
 * @description User profile management for EthioHome
 */

const User = require('../models/user.sequelize');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * Get current user profile
 */
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password_hash'] }
    });
    
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    return successResponse(res, user, 'Profile fetched successfully');
  } catch (error) {
    return errorResponse(res, 'Failed to fetch profile', 500);
  }
};

/**
 * Update user profile
 */
exports.updateProfile = async (req, res) => {
  try {
    const { first_name, last_name, phone_number, city, profile_image, preferred_language } = req.body;
    
    const user = await User.findByPk(req.user.id);
    if (!user) return errorResponse(res, 'User not found', 404);

    const updateData = {};
    if (first_name) updateData.first_name = first_name;
    if (last_name) updateData.last_name = last_name;
    if (phone_number) updateData.phone_number = phone_number;
    if (city) updateData.city = city;
    if (profile_image) updateData.profile_image = profile_image;
    if (preferred_language) updateData.preferred_language = preferred_language;

    await user.update(updateData);

    return successResponse(res, user, 'Profile updated successfully');
  } catch (error) {
    return errorResponse(res, 'Update failed', 500);
  }
};

/**
 * Upload profile image
 */
exports.uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return errorResponse(res, 'No image file provided', 400);
    }

    const user = await User.findByPk(req.user.id);
    if (!user) return errorResponse(res, 'User not found', 404);

    // Update profile_image with the path (URL provided by handleSingleUpload middleware)
    await user.update({ profile_image: req.file.path });

    return successResponse(res, user, 'Profile image updated successfully');
  } catch (error) {
    console.error('Upload Profile Image Error:', error);
    return errorResponse(res, 'Upload failed', 500);
  }
};

/**
 * Update language preference
 */
exports.updateLanguage = async (req, res) => {
  try {
    const { preferred_language } = req.body;
    
    if (!['English', 'Amharic'].includes(preferred_language)) {
      return errorResponse(res, 'Invalid language choice', 400);
    }

    await User.update(
      { preferred_language },
      { where: { user_id: req.user.id } }
    );

    return successResponse(res, null, 'Language preference updated');
  } catch (error) {
    return errorResponse(res, 'Update failed', 500);
  }
};

/**
 * Upload verification documents (Placeholder)
 */
exports.verifyIdentity = async (req, res) => {
  try {
    // Logic for handling file uploads (e.g., national ID photos)
    return successResponse(res, null, 'Documents submitted for verification');
  } catch (error) {
    return errorResponse(res, 'Submission failed', 500);
  }
};

/**
 * Deactivate/Delete account
 */
exports.deleteAccount = async (req, res) => {
  try {
    await User.update(
      { status: 'Inactive' },
      { where: { user_id: req.user.id } }
    );
    return successResponse(res, null, 'Account deactivated');
  } catch (error) {
    return errorResponse(res, 'Operation failed', 500);
  }
};

/**
 * Change user password
 */
exports.changePassword = async (req, res) => {
  try {
    const { old_password, new_password } = req.body;
    const bcrypt = require('bcryptjs');

    const user = await User.findByPk(req.user.id);
    if (!user) return errorResponse(res, 'User not found', 404);

    // Verify old password
    const isMatch = await bcrypt.compare(old_password, user.password_hash);
    if (!isMatch) return errorResponse(res, 'Incorrect current password', 400);

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(new_password, salt);

    await user.update({ password_hash: hashedPassword });

    return successResponse(res, null, 'Password changed successfully');
  } catch (error) {
    console.error('Change Password Error:', error);
    return errorResponse(res, 'Failed to change password', 500);
  }
};
