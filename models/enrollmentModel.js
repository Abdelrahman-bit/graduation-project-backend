import mongoose, { Schema } from 'mongoose';

const enrollmentSchema = new Schema(
   {
      student: {
         type: Schema.Types.ObjectId,
         ref: 'User',
         required: true,
      },

      course: {
         type: Schema.Types.ObjectId,
         ref: 'Course',
         required: true,
      },

      status: {
         type: String,
         enum: ['active', 'pending', 'unenrolled'],
         default: 'active',
      },
      progress: { type: Number, default: 0 },
      completedLectures: [
         {
            lectureId: { type: String },
            completedAt: { type: Date, default: Date.now },
         },
      ],
      lastAccessed: { type: Date, default: Date.now },
      isDeleted: { type: Boolean, default: false },

      // subscription info
      startsAt: {
         type: Date,
         default: Date.now,
      },

      expiresAt: {
         type: Date,
         required: true,
      },

      // audit / history
      unenrolledAt: Date,

      lastRenewedAt: Date,

      accessKeyUsed: {
         type: Schema.Types.ObjectId,
         ref: 'AccessKey',
      },
   },
   { timestamps: true }
);

// prevent duplicate enrollments
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

const enrollmentModel = mongoose.model('Enrollment', enrollmentSchema);

export default enrollmentModel;
