/**
 * @file chat.socket.js
 * @description Real-time chat engine for EthioHome based ONLY on chat_messages table
 */

const { verifyToken } = require('../config/jwt');
const { pool } = require('../config/db');

module.exports = (io) => {
  /**
   * 1️⃣ AUTHENTICATION MIDDLEWARE
   */
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return next(new Error('Authentication error: Invalid token'));
    }

    socket.user = decoded;
    next();
  });

  io.on('connection', (socket) => {
    console.log(`✅ User Connected: ${socket.user.id}`);

    // Join personal room
    socket.join(socket.user.id);

    /**
     * 2️⃣ SEND MESSAGE HANDLER
     */
    socket.on('send_message', async (data) => {
      try {
        const { receiver_id, message, image_url } = data;
        const sender_id = socket.user.id;

        if (!receiver_id) throw new Error('Receiver ID missing');

        // Persist message to PostgreSQL (No conversation_id)
        const msgQuery = `
          INSERT INTO chat_messages (sender_id, receiver_id, message, image_url)
          VALUES ($1, $2, $3, $4)
          RETURNING *;
        `;
        const { rows } = await pool.query(msgQuery, [sender_id, receiver_id, message, image_url || null]);
        const savedMessage = rows[0];

        // Emit to receiver
        io.to(receiver_id).emit('receive_message', savedMessage);
        
        // Acknowledge back to sender
        socket.emit('message_sent', savedMessage);

      } catch (error) {
        console.error('❌ Chat Socket Error:', error.message);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    /**
     * 3️⃣ MARK CONVERSATION AS READ
     */
    socket.on('mark_read', async (data) => {
      try {
        const { partner_id } = data;
        const updateQuery = `
          UPDATE chat_messages 
          SET is_read = true, read_at = NOW()
          WHERE sender_id = $1 AND receiver_id = $2 AND is_read = false;
        `;
        await pool.query(updateQuery, [partner_id, socket.user.id]);
      } catch (error) {
        console.error('❌ Read Status Error:', error.message);
      }
    });

    socket.on('disconnect', () => {
      console.log(`❌ User Disconnected: ${socket.user.id}`);
    });
  });
};
