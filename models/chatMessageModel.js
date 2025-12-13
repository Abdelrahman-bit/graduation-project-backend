import mongoose, { Schema } from 'mongoose';

/**
 * ChatMessage Model
 * Represents individual messages within a chat group.
 */
const chatMessageSchema = new Schema(
   {
      chatGroup: {
         type: Schema.Types.ObjectId,
         ref: 'ChatGroup',
         required: [true, 'Message must belong to a chat group'],
      },
      sender: {
         type: Schema.Types.ObjectId,
         ref: 'User',
         required: [true, 'Message must have a sender'],
      },
      content: {
         type: String,
         required: [true, 'Message content is required'],
         maxlength: [2000, 'Message cannot exceed 2000 characters'],
         trim: true,
      },
      messageType: {
         type: String,
         enum: ['text', 'system'],
         default: 'text',
      },
      // For system messages (e.g., "User joined the group")
      metadata: {
         type: Schema.Types.Mixed,
         default: null,
      },
      // Soft delete support
      isDeleted: {
         type: Boolean,
         default: false,
      },
   },
   {
      timestamps: true,
   }
);

// Compound index for efficient message retrieval per group
chatMessageSchema.index({ chatGroup: 1, createdAt: -1 });
chatMessageSchema.index({ sender: 1 });

// Pre-find middleware to exclude deleted messages by default
chatMessageSchema.pre(/^find/, function () {
   // Only apply if not explicitly querying for deleted
   if (this.getQuery().isDeleted === undefined) {
      this.where({ isDeleted: false });
   }
});

// Static method to get paginated messages for a group
chatMessageSchema.statics.getMessagesForGroup = async function (
   chatGroupId,
   { page = 1, limit = 50 } = {}
) {
   const skip = (page - 1) * limit;

   const messages = await this.find({ chatGroup: chatGroupId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'firstname lastname avatar')
      .lean();

   const total = await this.countDocuments({ chatGroup: chatGroupId });

   return {
      messages: messages.reverse(), // Return in chronological order
      pagination: {
         page,
         limit,
         total,
         pages: Math.ceil(total / limit),
         hasMore: page * limit < total,
      },
   };
};

// Static method to create a system message
chatMessageSchema.statics.createSystemMessage = async function (
   chatGroupId,
   content,
   metadata = {}
) {
   // Use a null sender or create a system user ID
   // For now, we'll skip sender validation for system messages
   const ChatGroup = mongoose.model('ChatGroup');
   const group = await ChatGroup.findById(chatGroupId);

   if (!group) {
      throw new Error('Chat group not found');
   }

   return this.create({
      chatGroup: chatGroupId,
      sender: group.admin, // System messages attributed to admin
      content,
      messageType: 'system',
      metadata,
   });
};

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);
export default ChatMessage;
