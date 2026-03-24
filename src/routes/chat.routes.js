const express = require('express');
const router = express.Router();
const requireAuth = require('../middlewares/auth.middleware');
const cookieParser = require('cookie-parser');

const chatController = require('../controllers/chat.controller');

router.use(cookieParser());

router.use(requireAuth);


router.post('/conversations/:friendId', chatController.createOrGetConversation);
router.get('/conversations', chatController.getMyConversations);
router.get('/conversations/:conversationId/messages', chatController.getConversationMessages);
router.post('/conversations/:conversationId/messages', chatController.sendMessage);
router.patch('/conversations/:conversationId/read', chatController.markConversationAsRead);

module.exports = router;