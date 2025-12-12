import express from 'express';
import auth from '../middleware/authentication.js';
import {
   getNotifications,
   getUnreadCount,
   markAsRead,
   markAllAsRead,
   markGroupAsRead,
   deleteNotification,
} from '../controller/notificationController.js';

const router = express.Router();

/**
 * Notification Routes
 * All routes require authentication
 *
 * GET    /api/notifications           - Get all notifications (paginated)
 * GET    /api/notifications/unread-count - Get unread count
 * PATCH  /api/notifications/:id/read  - Mark one as read
 * PATCH  /api/notifications/read-all  - Mark all as read
 * PATCH  /api/notifications/group/:groupId/read - Mark group notifications as read
 * DELETE /api/notifications/:id       - Delete a notification
 */

// All routes require authentication
router.use(auth);

// Get notifications and unread count
router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);

// Mark as read
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', markAsRead);
router.patch('/group/:groupId/read', markGroupAsRead);

// Delete
router.delete('/:id', deleteNotification);

export default router;
