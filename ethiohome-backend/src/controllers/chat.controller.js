/**
 * @file chat.controller.js
 * @description Controller for persistent chat history based ONLY on chat_messages table
 */

const { pool } = require('../config/db');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * Get all conversation partners for the authenticated user
 * This finds unique chat pairs from the chat_messages table
 */
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Complex query to get unique partners and their last message
    // We use a subquery to find the latest message per partner pair
    const query = `
      WITH LatestMessages AS (
        SELECT 
          CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END as partner_id,
          message,
          created_at,
          is_read,
          sender_id,
          ROW_NUMBER() OVER(PARTITION BY CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END ORDER BY created_at DESC) as rn
        FROM chat_messages
        WHERE sender_id = $1 OR receiver_id = $1
      ),
      UnreadCounts AS (
        SELECT 
          sender_id as partner_id,
          COUNT(*) as unread_count
        FROM chat_messages
        WHERE receiver_id = $1 AND is_read = false
        GROUP BY sender_id
      )
      SELECT 
        lm.partner_id,
        lm.message as last_message,
        lm.created_at as last_message_at,
        u.first_name as partner_name,
        u.role as partner_role,
        u.profile_image as partner_image,
        COALESCE(uc.unread_count, 0) as unread_count
      FROM LatestMessages lm
      JOIN users u ON lm.partner_id = u.user_id
      LEFT JOIN UnreadCounts uc ON lm.partner_id = uc.partner_id
      WHERE lm.rn = 1
      ORDER BY lm.created_at DESC;
    `;
    
    const { rows } = await pool.query(query, [userId]);
    
    // Map to a consistent format for the frontend
    const formattedRows = rows.map(row => ({
      conversation_id: row.partner_id, // We use partner_id as the unique identifier for the UI
      partner_id: row.partner_id,
      last_message: row.last_message,
      last_message_at: row.last_message_at,
      partner_name: row.partner_name,
      partner_role: row.partner_role,
      partner_image: row.partner_image,
      unread_count: parseInt(row.unread_count)
    }));

    return successResponse(res, formattedRows, 'Conversations fetched successfully');
  } catch (error) {
    console.error('Fetch Conversations Error:', error);
    return errorResponse(res, 'Failed to fetch conversations', 500, error.message);
  }
};

/**
 * Start a conversation with a user (Verify user exists)
 */
exports.startConversation = async (req, res) => {
  try {
    const { receiver_id } = req.body;
    const sender_id = req.user?.id;

    if (!sender_id) {
      return errorResponse(res, 'Authentication required', 401);
    }

    if (!receiver_id) {
      return errorResponse(res, 'Receiver ID is required', 400);
    }

    if (sender_id === receiver_id) {
      return errorResponse(res, 'You cannot chat with yourself', 400);
    }

    // Verify receiver exists
    const receiverResult = await pool.query(
      'SELECT user_id, first_name, role, profile_image FROM users WHERE user_id = $1',
      [receiver_id]
    );

    if (receiverResult.rows.length === 0) {
      return errorResponse(res, 'User not found', 404);
    }

    const partner = receiverResult.rows[0];

    // Return a virtual conversation object
    return successResponse(res, {
      conversation_id: partner.user_id, // Use partner_id as virtual conversation_id
      partner_id: partner.user_id,
      partner_name: partner.first_name,
      partner_role: partner.role,
      partner_image: partner.profile_image
    }, 'Chat initialized');
  } catch (error) {
    console.error('Start Chat Error:', error);
    return errorResponse(res, 'Failed to initialize chat', 500);
  }
};

/**
 * Get messages between current user and a partner
 */
exports.getConversationById = async (req, res) => {
  try {
    const partnerId = req.params.id; // This is now the partner's user_id
    const userId = req.user.id;

    const query = `
      SELECT * FROM chat_messages 
      WHERE (sender_id = $1 AND receiver_id = $2)
         OR (sender_id = $2 AND receiver_id = $1)
      ORDER BY created_at ASC;
    `;
    const { rows } = await pool.query(query, [userId, partnerId]);
    return successResponse(res, rows, 'Messages fetched');
  } catch (error) {
    console.error('Fetch Messages Error:', error);
    return errorResponse(res, 'Failed to fetch messages', 500);
  }
};

/**
 * Mark messages from a specific partner as read
 */
exports.markAsRead = async (req, res) => {
  try {
    const partnerId = req.params.id;
    const userId = req.user.id;

    await pool.query(
      'UPDATE chat_messages SET is_read = true, read_at = NOW() WHERE sender_id = $1 AND receiver_id = $2 AND is_read = false',
      [partnerId, userId]
    );
    return successResponse(res, null, 'Messages marked as read');
  } catch (error) {
    return errorResponse(res, 'Failed to update read status', 500);
  }
};

/**
 * Send a message via REST
 */
exports.sendMessage = async (req, res) => {
  try {
    const { receiver_id, message, image_url } = req.body;
    const sender_id = req.user.id;

    if (!receiver_id || (!message && !image_url)) {
      return errorResponse(res, 'Receiver ID and content are required', 400);
    }

    const query = `
      INSERT INTO chat_messages (sender_id, receiver_id, message, image_url)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [sender_id, receiver_id, message, image_url || null]);

    return successResponse(res, rows[0], 'Message sent successfully');
  } catch (error) {
    console.error('Send Message Error:', error);
    return errorResponse(res, 'Failed to send message', 500);
  }
};

/**
 * Upload chat image
 */
exports.uploadChatImage = async (req, res) => {
  try {
    if (!req.file) {
      return errorResponse(res, 'No file uploaded', 400);
    }
    return successResponse(res, { 
      image_url: req.file.path 
    }, 'Image uploaded successfully');
  } catch (error) {
    return errorResponse(res, 'Upload failed', 500);
  }
};
