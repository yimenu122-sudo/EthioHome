/**
 * @file chat.socket.js
 * @description Real-time chat engine for EthioHome using Socket.io
 */

const { verifyToken } = require('../config/jwt');
const { pool } = require('../config/db');

module.exports = (io) => {
  /**
   * 1️⃣ AUTHENTICATION MIDDLEWARE
   * Verifies JWT before allowing socket connection
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

    // Attach user info to socket
    socket.user = decoded;
    next();
  });

  io.on('connection', (socket) => {
    console.log(`✅ User Connected: ${socket.user.id} (${socket.user.role})`);

    /**
     * 2️⃣ JOIN PERSONAL ROOM
     * Each user joins a room named after their ID for private messaging
     */
    socket.join(socket.user.id);

    /**
     * 3️⃣ SEND MESSAGE HANDLER
     */
    socket.on('send_message', async (data) => {
      try {
        const { receiver_id, message, conversation_id } = data;
        const sender_id = socket.user.id;

        // 1. Persist message to PostgreSQL
        const msgQuery = `
          INSERT INTO chat_messages (conversation_id, sender_id, receiver_id, message, image_url)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *;
        `;
        const { rows } = await pool.query(msgQuery, [conversation_id, sender_id, receiver_id, message, data.image_url || null]);
        const savedMessage = rows[0];

        // 2. Update conversation last message
        const convQuery = `
          UPDATE conversations 
          SET last_message = $1, last_message_at = NOW(), updated_at = NOW()
          WHERE conversation_id = $2;
        `;
        await pool.query(convQuery, [message, conversation_id]);

        // 3. Emit to receiver in real-time
        io.to(receiver_id).emit('receive_message', savedMessage);
        
        // 4. Acknowledge back to sender
        socket.emit('message_sent', savedMessage);

      } catch (error) {
        console.error('❌ Chat Error:', error.message);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    /**
     * 4️⃣ MARK AS READ HANDLER
     */
    socket.on('mark_read', async (data) => {
      try {
        const { message_id } = data;
        const updateQuery = `
          UPDATE chat_messages 
          SET is_read = true, read_at = NOW()
          WHERE message_id = $1 AND receiver_id = $2
          RETURNING *;
        `;
        await pool.query(updateQuery, [message_id, socket.user.id]);
        
        // Notify sender that message was read
        // (Optional logic to find sender and emit)
      } catch (error) {
        console.error('❌ Read Status Error:', error.message);
      }
    });

    /**
     * 5️⃣ DISCONNECT HANDLER
     */
    socket.on('disconnect', () => {
      console.log(`👋 User Disconnected: ${socket.user.id}`);
    });
  });
};
