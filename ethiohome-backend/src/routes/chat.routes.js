/**
 * @file chat.routes.js
 * @description REST endpoints for persistent chat history
 * @author Senior Node.js Developer
 */

const express = require('express');
const router = express.Router();
// Assuming a chat controller exists or using property/user controller logic
// For now, let's assume chat.controller exists as per the structure
const chatController = require('../controllers/chat.controller'); 
const auth = require('../middlewares/auth.middleware');
const { handleSingleUpload } = require('../middlewares/upload.middleware');

router.use(auth);

// Upload chat image
router.post('/upload', handleSingleUpload, chatController.uploadChatImage);

// Get list of conversations for the current user
router.get('/conversations', chatController.getConversations);

// Start or get a conversation with another user
router.post('/conversations', chatController.startConversation);

// Get specific conversation messages
router.get('/conversations/:id', chatController.getConversationById);

// Send message (REST fallback or for history)
router.post('/messages', chatController.sendMessage);

// Mark as read
router.put('/messages/:id/read', chatController.markAsRead);

module.exports = router;
