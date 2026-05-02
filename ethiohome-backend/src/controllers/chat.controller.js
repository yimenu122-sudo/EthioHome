/**
 * @file chat.controller.js
 * @description Controller for persistent chat history and conversation management
 */

const { pool } = require('../config/db');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * Get all conversations for the authenticated user
 */
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const query = `
      SELECT c.*, 
             u1.first_name as part1_name, u2.first_name as part2_name
      FROM conversations c
      JOIN users u1 ON c.participant_one = u1.user_id
      JOIN users u2 ON c.participant_two = u2.user_id
      WHERE participant_one = $1 OR participant_two = $1
      ORDER BY last_message_at DESC;
    `;
    const { rows } = await pool.query(query, [userId]);
    return successResponse(res, rows, 'Conversations fetched successfully');
  } catch (error) {
    return errorResponse(res, 'Failed to fetch conversations', 500, error.message);
  }
};

/**
 * Start or get an existing conversation between two users
 */
exports.startConversation = async (req, res) => {
  try {
    const { receiver_id } = req.body;
    const sender_id = req.user.id;

    // Ordered ID check to ensure unique pairs (p1 < p2)
    const [p1, p2] = sender_id < receiver_id ? [sender_id, receiver_id] : [receiver_id, sender_id];

    const findQuery = `
      INSERT INTO conversations (participant_one, participant_two)
      VALUES ($1, $2)
      ON CONFLICT (participant_one, participant_two) DO UPDATE SET updated_at = NOW()
      RETURNING *;
    `;
    const { rows } = await pool.query(findQuery, [p1, p2]);
    return successResponse(res, rows[0], 'Conversation initialized');
  } catch (error) {
    return errorResponse(res, 'Failed to start conversation', 500);
  }
};

/**
 * Get messages for a specific conversation
 */
exports.getConversationById = async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT * FROM chat_messages 
      WHERE conversation_id = $1 
      ORDER BY created_at ASC;
    `;
    const { rows } = await pool.query(query, [id]);
    return successResponse(res, rows, 'Messages fetched');
  } catch (error) {
    return errorResponse(res, 'Failed to fetch messages', 500);
  }
};

/**
 * Mark messages as read in a conversation
 */
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params; // conversation_id
    await pool.query(
      'UPDATE chat_messages SET is_read = true, read_at = NOW() WHERE conversation_id = $1 AND receiver_id = $2',
      [id, req.user.id]
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
  const client = await pool.connect();
  try {
    const { conversation_id, receiver_id, message } = req.body;
    const sender_id = req.user.id;

    await client.query('BEGIN');

    // Insert message
    const insertMsgQuery = `
      INSERT INTO chat_messages (conversation_id, sender_id, receiver_id, message, image_url)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const { rows: msgRows } = await client.query(insertMsgQuery, [conversation_id, sender_id, receiver_id, message, req.body.image_url || null]);

    // Update conversation metadata
    const updateConvQuery = `
      UPDATE conversations 
      SET last_message = $1, last_message_at = NOW(), updated_at = NOW()
      WHERE conversation_id = $2;
    `;
    await client.query(updateConvQuery, [message, conversation_id]);

    await client.query('COMMIT');
    return successResponse(res, msgRows[0], 'Message sent successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Send Message Error:', error);
    return errorResponse(res, 'Failed to send message', 500);
  } finally {
    client.release();
  }
};
