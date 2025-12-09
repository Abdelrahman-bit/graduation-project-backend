import mongoose, { Schema } from 'mongoose';

const enrollmentSchema = new Schema(
   {
      student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
      status: {
         type: String,
         enum: ['enrolled', 'unenrolled'],
         default: 'enrolled',
      },
      unenrolledAt: { type: Date },
      progress: { type: Number, default: 0 },
      completedLectures: [{ type: Schema.Types.ObjectId }],
      lastAccessed: { type: Date, default: Date.now },
   },
   { timestamps: true }
);

// Make sure user cannot enroll same course twice
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

const enrollmentModel = mongoose.model('Enrollment', enrollmentSchema);

export default enrollmentModel;
