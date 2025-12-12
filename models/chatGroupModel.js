import mongoose, { Schema } from 'mongoose';

/**
 * ChatGroup Model
 * Represents a chat group associated with a course.
 * Each course has exactly one chat group.
 */
const chatGroupSchema = new Schema(
   {
      course: {
         type: Schema.Types.ObjectId,
         ref: 'Course',
         required: [true, 'Chat group must be associated with a course'],
         unique: true,
      },
      // The instructor who owns/administers this chat group
      admin: {
         type: Schema.Types.ObjectId,
         ref: 'User',
         required: [true, 'Chat group must have an admin (instructor)'],
      },
      // All members including instructor and enrolled students
      members: [
         {
            type: Schema.Types.ObjectId,
            ref: 'User',
         },
      ],
      // Chat settings controlled by the instructor
      settings: {
         instructorOnlyMode: {
            type: Boolean,
            default: false,
            description: 'When true, only the instructor can send messages',
         },
         isActive: {
            type: Boolean,
            default: true,
            description: 'When false, chat is disabled for this course',
         },
      },
      // Last message timestamp for sorting chat lists
      lastMessageAt: {
         type: Date,
         default: null,
      },
   },
   {
      timestamps: true,
      toJSON: { virtuals: true },
      toObject: { virtuals: true },
   }
);

// Virtual to get message count (for unread indicators in future)
chatGroupSchema.virtual('messageCount', {
   ref: 'ChatMessage',
   localField: '_id',
   foreignField: 'chatGroup',
   count: true,
});

// Index for efficient querying
chatGroupSchema.index({ admin: 1 });
chatGroupSchema.index({ members: 1 });
chatGroupSchema.index({ lastMessageAt: -1 });

// Instance method to check if a user is a member
chatGroupSchema.methods.isMember = function (userId) {
   return this.members.some(
      (member) => member.toString() === userId.toString()
   );
};

// Instance method to check if user can send messages
chatGroupSchema.methods.canSendMessage = function (userId) {
   if (!this.settings.isActive) return false;
   if (this.settings.instructorOnlyMode) {
      return this.admin.toString() === userId.toString();
   }
   return this.isMember(userId);
};

// Static method to find or create chat group for a course
chatGroupSchema.statics.findOrCreateForCourse = async function (
   courseId,
   instructorId
) {
   let chatGroup = await this.findOne({ course: courseId });

   if (!chatGroup) {
      chatGroup = await this.create({
         course: courseId,
         admin: instructorId,
         members: [instructorId],
      });
   }

   return chatGroup;
};

// Static method to add member to chat group
chatGroupSchema.statics.addMember = async function (courseId, userId) {
   return this.findOneAndUpdate(
      { course: courseId },
      { $addToSet: { members: userId } },
      { new: true }
   );
};

// Static method to remove member from chat group
chatGroupSchema.statics.removeMember = async function (courseId, userId) {
   return this.findOneAndUpdate(
      { course: courseId },
      { $pull: { members: userId } },
      { new: true }
   );
};

const ChatGroup = mongoose.model('ChatGroup', chatGroupSchema);
export default ChatGroup;
