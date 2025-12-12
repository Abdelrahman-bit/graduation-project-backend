import mongoose, { Schema } from 'mongoose';

/**
 * Notification Model
 *
 * Stores notifications for users about chat messages and other events.
 * Supports priority levels for instructor messages.
 */
const notificationSchema = new Schema(
   {
      // Who receives the notification
      recipient: {
         type: Schema.Types.ObjectId,
         ref: 'User',
         required: [true, 'Notification must have a recipient'],
         index: true,
      },

      // Type of notification
      type: {
         type: String,
         enum: [
            'new_message',
            'instructor_message',
            'settings_changed',
            'system',
         ],
         default: 'new_message',
      },

      // Display content
      title: {
         type: String,
         required: [true, 'Notification must have a title'],
         maxlength: [200, 'Title cannot exceed 200 characters'],
      },
      message: {
         type: String,
         required: [true, 'Notification must have a message'],
         maxlength: [500, 'Message cannot exceed 500 characters'],
      },

      // Related entities
      relatedGroup: {
         type: Schema.Types.ObjectId,
         ref: 'ChatGroup',
      },
      relatedMessage: {
         type: Schema.Types.ObjectId,
         ref: 'ChatMessage',
      },
      relatedCourse: {
         type: Schema.Types.ObjectId,
         ref: 'Course',
      },

      // Sender info (denormalized for quick display)
      sender: {
         _id: Schema.Types.ObjectId,
         firstname: String,
         lastname: String,
         avatar: String,
         role: String,
      },

      // Status
      isRead: {
         type: Boolean,
         default: false,
         index: true,
      },

      // Priority: 'high' for instructor messages
      priority: {
         type: String,
         enum: ['normal', 'high'],
         default: 'normal',
      },

      // For grouping multiple messages
      groupKey: {
         type: String,
         index: true,
      },
   },
   {
      timestamps: true,
   }
);

// Compound indexes for efficient queries
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, relatedGroup: 1 });

/**
 * Get notifications for a user with pagination
 */
notificationSchema.statics.getForUser = async function (
   userId,
   { page = 1, limit = 20, unreadOnly = false } = {}
) {
   const query = { recipient: userId };
   if (unreadOnly) {
      query.isRead = false;
   }

   const skip = (page - 1) * limit;

   const notifications = await this.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

   const total = await this.countDocuments(query);
   const unreadCount = await this.countDocuments({
      recipient: userId,
      isRead: false,
   });

   return {
      notifications,
      pagination: {
         page,
         limit,
         total,
         pages: Math.ceil(total / limit),
         hasMore: page * limit < total,
      },
      unreadCount,
   };
};

/**
 * Get unread count for a user
 */
notificationSchema.statics.getUnreadCount = async function (userId) {
   return this.countDocuments({ recipient: userId, isRead: false });
};

/**
 * Mark notification as read
 */
notificationSchema.statics.markAsRead = async function (
   notificationId,
   userId
) {
   return this.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { isRead: true },
      { new: true }
   );
};

/**
 * Mark all notifications as read for a user
 */
notificationSchema.statics.markAllAsRead = async function (userId) {
   return this.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true }
   );
};

/**
 * Mark notifications for a specific group as read
 */
notificationSchema.statics.markGroupAsRead = async function (userId, groupId) {
   return this.updateMany(
      { recipient: userId, relatedGroup: groupId, isRead: false },
      { isRead: true }
   );
};

/**
 * Create a chat message notification
 */
notificationSchema.statics.createMessageNotification = async function ({
   recipientId,
   senderId,
   senderInfo,
   groupId,
   groupName,
   messageId,
   messagePreview,
   isInstructor = false,
}) {
   const type = isInstructor ? 'instructor_message' : 'new_message';
   const priority = isInstructor ? 'high' : 'normal';
   const title = isInstructor
      ? `📢 Instructor message in ${groupName}`
      : `New message in ${groupName}`;

   return this.create({
      recipient: recipientId,
      type,
      title,
      message:
         messagePreview.length > 100
            ? messagePreview.substring(0, 100) + '...'
            : messagePreview,
      relatedGroup: groupId,
      relatedMessage: messageId,
      sender: {
         _id: senderId,
         firstname: senderInfo.firstname,
         lastname: senderInfo.lastname,
         avatar: senderInfo.avatar,
         role: senderInfo.role,
      },
      priority,
      groupKey: `chat:${groupId}`,
   });
};

/**
 * Delete old notifications (cleanup job)
 */
notificationSchema.statics.cleanupOld = async function (daysOld = 30) {
   const cutoffDate = new Date();
   cutoffDate.setDate(cutoffDate.getDate() - daysOld);

   return this.deleteMany({
      createdAt: { $lt: cutoffDate },
      isRead: true,
   });
};

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
