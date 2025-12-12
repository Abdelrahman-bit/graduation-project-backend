import express from 'express';
import auth from '../middleware/authentication.js';
import restrictTo from '../middleware/authorization.js';
import {
   getUserChatGroups,
   getChatGroupById,
   getGroupMessages,
   sendMessage,
   updateChatSettings,
   getChatGroupByCourse,
} from '../controller/chatController.js';

const router = express.Router();

// All chat routes require authentication
router.use(auth);

// Get all chat groups for the current user
router.get('/groups', getUserChatGroups);

// Get a specific chat group by ID
router.get('/groups/:groupId', getChatGroupById);

// Get chat group by course ID
router.get('/course/:courseId', getChatGroupByCourse);

// Get messages for a chat group (with pagination)
router.get('/groups/:groupId/messages', getGroupMessages);

// Send a message to a chat group (REST fallback)
router.post('/groups/:groupId/messages', sendMessage);

// Update chat settings (instructor only - but controller handles authorization)
router.patch('/groups/:groupId/settings', updateChatSettings);

export default router;
