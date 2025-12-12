import Notification from '../models/notificationModel.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';

/**
 * Get all notifications for the current user
 * @route GET /api/notifications
 */
export const getNotifications = catchAsync(async (req, res, next) => {
   const userId = req.user._id;
   const page = parseInt(req.query.page, 10) || 1;
   const limit = parseInt(req.query.limit, 10) || 20;
   const unreadOnly = req.query.unreadOnly === 'true';

   const result = await Notification.getForUser(userId, {
      page,
      limit,
      unreadOnly,
   });

   res.status(200).json({
      status: 'success',
      data: result.notifications,
      pagination: result.pagination,
      unreadCount: result.unreadCount,
   });
});

/**
 * Get unread notification count
 * @route GET /api/notifications/unread-count
 */
export const getUnreadCount = catchAsync(async (req, res, next) => {
   const userId = req.user._id;
   const count = await Notification.getUnreadCount(userId);

   res.status(200).json({
      status: 'success',
      data: { count },
   });
});

/**
 * Mark a single notification as read
 * @route PATCH /api/notifications/:id/read
 */
export const markAsRead = catchAsync(async (req, res, next) => {
   const { id } = req.params;
   const userId = req.user._id;

   const notification = await Notification.markAsRead(id, userId);

   if (!notification) {
      return next(new AppError('Notification not found', 404));
   }

   res.status(200).json({
      status: 'success',
      data: notification,
   });
});

/**
 * Mark all notifications as read
 * @route PATCH /api/notifications/read-all
 */
export const markAllAsRead = catchAsync(async (req, res, next) => {
   const userId = req.user._id;

   const result = await Notification.markAllAsRead(userId);

   res.status(200).json({
      status: 'success',
      message: `Marked ${result.modifiedCount} notifications as read`,
   });
});

/**
 * Mark notifications for a specific group as read
 * @route PATCH /api/notifications/group/:groupId/read
 */
export const markGroupAsRead = catchAsync(async (req, res, next) => {
   const { groupId } = req.params;
   const userId = req.user._id;

   const result = await Notification.markGroupAsRead(userId, groupId);

   res.status(200).json({
      status: 'success',
      message: `Marked ${result.modifiedCount} notifications as read`,
   });
});

/**
 * Delete a notification
 * @route DELETE /api/notifications/:id
 */
export const deleteNotification = catchAsync(async (req, res, next) => {
   const { id } = req.params;
   const userId = req.user._id;

   const notification = await Notification.findOneAndDelete({
      _id: id,
      recipient: userId,
   });

   if (!notification) {
      return next(new AppError('Notification not found', 404));
   }

   res.status(204).json({
      status: 'success',
      data: null,
   });
});
