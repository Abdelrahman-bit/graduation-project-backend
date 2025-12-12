import ChatGroup from '../models/chatGroupModel.js';
import ChatMessage from '../models/chatMessageModel.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';
import Ably from 'ably';

// Initialize Ably REST client for publishing
const getAblyClient = () => {
   const apiKey = process.env.ABLY_API_KEY;
   if (!apiKey) {
      console.warn('[Chat] ABLY_API_KEY not set, real-time updates disabled');
      return null;
   }
   return new Ably.Rest(apiKey);
};

/**
 * Get all chat groups for the current user
 * - Instructors see groups for their courses
 * - Students see groups for enrolled courses
 */
export const getUserChatGroups = catchAsync(async (req, res, next) => {
   const userId = req.user._id;
   const userRole = req.user.role;

   let query = {};

   if (userRole === 'instructor') {
      // Get groups where user is admin
      query = { admin: userId };
   } else {
      // Get groups where user is a member
      query = { members: userId };
   }

   const chatGroups = await ChatGroup.find(query)
      .populate({
         path: 'course',
         select: 'basicInfo.title advancedInfo.thumbnail slug status',
      })
      .populate('admin', 'firstname lastname avatar')
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .lean();

   // Add member count for each group
   const groupsWithMeta = chatGroups.map((group) => ({
      ...group,
      memberCount: group.members?.length || 0,
   }));

   res.status(200).json({
      status: 'success',
      results: groupsWithMeta.length,
      data: groupsWithMeta,
   });
});

/**
 * Get a specific chat group by ID
 */
export const getChatGroupById = catchAsync(async (req, res, next) => {
   const { groupId } = req.params;
   const userId = req.user._id;

   const chatGroup = await ChatGroup.findById(groupId)
      .populate({
         path: 'course',
         select: 'basicInfo.title advancedInfo.thumbnail slug instructor',
      })
      .populate('admin', 'firstname lastname avatar')
      .populate('members', 'firstname lastname avatar');

   if (!chatGroup) {
      return next(new AppError('Chat group not found', 404));
   }

   // Check if user has access
   const isMember = chatGroup.members.some(
      (member) => member._id.toString() === userId.toString()
   );
   const isAdmin = chatGroup.admin._id.toString() === userId.toString();

   if (!isMember && !isAdmin) {
      return next(
         new AppError('You do not have access to this chat group', 403)
      );
   }

   res.status(200).json({
      status: 'success',
      data: chatGroup,
   });
});

/**
 * Get messages for a chat group with pagination
 */
export const getGroupMessages = catchAsync(async (req, res, next) => {
   const { groupId } = req.params;
   const userId = req.user._id;
   const page = parseInt(req.query.page, 10) || 1;
   const limit = parseInt(req.query.limit, 10) || 50;

   // Verify user has access to this group
   const chatGroup = await ChatGroup.findById(groupId);

   if (!chatGroup) {
      return next(new AppError('Chat group not found', 404));
   }

   const isMember = chatGroup.isMember(userId);
   const isAdmin = chatGroup.admin.toString() === userId.toString();

   if (!isMember && !isAdmin) {
      return next(
         new AppError('You do not have access to this chat group', 403)
      );
   }

   const result = await ChatMessage.getMessagesForGroup(groupId, {
      page,
      limit,
   });

   res.status(200).json({
      status: 'success',
      data: result.messages,
      pagination: result.pagination,
   });
});

/**
 * Send a message to a chat group (REST fallback, Socket.IO preferred)
 */
export const sendMessage = catchAsync(async (req, res, next) => {
   const { groupId } = req.params;
   const { content } = req.body;
   const userId = req.user._id;

   if (!content || !content.trim()) {
      return next(new AppError('Message content is required', 400));
   }

   const chatGroup = await ChatGroup.findById(groupId);

   if (!chatGroup) {
      return next(new AppError('Chat group not found', 404));
   }

   // Check if user can send messages
   if (!chatGroup.canSendMessage(userId)) {
      if (chatGroup.settings.instructorOnlyMode) {
         return next(
            new AppError(
               'Only the instructor can send messages in this chat',
               403
            )
         );
      }
      return next(new AppError('You cannot send messages to this chat', 403));
   }

   // Create the message
   const message = await ChatMessage.create({
      chatGroup: groupId,
      sender: userId,
      content: content.trim(),
   });

   // Update last message timestamp
   await ChatGroup.findByIdAndUpdate(groupId, { lastMessageAt: new Date() });

   // Populate sender info for response
   await message.populate('sender', 'firstname lastname avatar');

   // Publish message via Ably for real-time delivery
   try {
      const ably = getAblyClient();
      if (ably) {
         const channel = ably.channels.get(`chat:${groupId}`);
         await channel.publish('message', {
            ...message.toObject(),
            chatGroup: groupId,
         });
         console.log(`[Chat] Message published to chat:${groupId}`);
      }
   } catch (ablyError) {
      console.error(
         '[Chat] Failed to publish message via Ably:',
         ablyError.message
      );
      // Continue - message is saved, just real-time delivery failed
   }

   res.status(201).json({
      status: 'success',
      data: message,
   });
});

/**
 * Update chat group settings (instructor only)
 */
export const updateChatSettings = catchAsync(async (req, res, next) => {
   const { groupId } = req.params;
   const { instructorOnlyMode, isActive } = req.body;
   const userId = req.user._id;

   const chatGroup = await ChatGroup.findById(groupId);

   if (!chatGroup) {
      return next(new AppError('Chat group not found', 404));
   }

   // Only admin can update settings
   if (chatGroup.admin.toString() !== userId.toString()) {
      return next(
         new AppError('Only the instructor can update chat settings', 403)
      );
   }

   // Build update object
   const updates = {};
   if (typeof instructorOnlyMode === 'boolean') {
      updates['settings.instructorOnlyMode'] = instructorOnlyMode;
   }
   if (typeof isActive === 'boolean') {
      updates['settings.isActive'] = isActive;
   }

   const updatedGroup = await ChatGroup.findByIdAndUpdate(groupId, updates, {
      new: true,
      runValidators: true,
   }).populate('course', 'basicInfo.title');

   // Publish settings change via Ably for real-time updates
   try {
      const ably = getAblyClient();
      if (ably) {
         const channel = ably.channels.get(`chat:${groupId}`);
         await channel.publish('settings_updated', {
            groupId,
            settings: updatedGroup.settings,
         });
         console.log(`[Chat] Settings update published to chat:${groupId}`);
      }
   } catch (ablyError) {
      console.error(
         '[Chat] Failed to publish settings update via Ably:',
         ablyError.message
      );
      // Continue - the REST response will still be sent
   }

   res.status(200).json({
      status: 'success',
      data: updatedGroup,
   });
});

/**
 * Get chat groups for a specific course (by course ID)
 */
export const getChatGroupByCourse = catchAsync(async (req, res, next) => {
   const { courseId } = req.params;
   const userId = req.user._id;

   const chatGroup = await ChatGroup.findOne({ course: courseId })
      .populate({
         path: 'course',
         select: 'basicInfo.title advancedInfo.thumbnail slug',
      })
      .populate('admin', 'firstname lastname avatar');

   if (!chatGroup) {
      return next(new AppError('Chat group not found for this course', 404));
   }

   // Check access
   const isMember = chatGroup.isMember(userId);
   const isAdmin = chatGroup.admin._id.toString() === userId.toString();

   if (!isMember && !isAdmin) {
      return next(
         new AppError('You do not have access to this chat group', 403)
      );
   }

   res.status(200).json({
      status: 'success',
      data: chatGroup,
   });
});
