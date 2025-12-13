import mongoose, { Schema } from 'mongoose';

const enrollmentRequestSchema = new Schema(
   {
      student: {
         type: mongoose.Schema.Types.ObjectId,
         ref: 'User',
         required: true,
      },

      course: {
         type: mongoose.Schema.Types.ObjectId,
         ref: 'Course',
         required: true,
      },
      instructor: {
         type: mongoose.Schema.Types.ObjectId,
         ref: 'User',
         required: true,
      },
      status: {
         type: String,
         enum: ['pending', 'approved', 'rejected'],
         default: 'pending',
      },

      // For cleaning up old ignored requests
      expiresAt: {
         type: Date,
         default: () => Date.now() + 30 * 24 * 60 * 60 * 1000, // optional
      },

      createdAt: {
         type: Date,
         default: Date.now,
      },
   },
   { timestamps: true }
);

// auto-delete expired requests
enrollmentRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const enrollmentRequestModel = mongoose.model(
   'EnrollmentRequest',
   enrollmentRequestSchema
);

export default enrollmentRequestModel;
