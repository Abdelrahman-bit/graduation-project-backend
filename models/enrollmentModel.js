import mongoose, { Schema } from 'mongoose';

const enrollmentSchema = new Schema(
   {
      user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
      status: {
         type: String,
         enum: ['enrolled', 'unenrolled'],
         default: 'enrolled',
      },
      unenrolledAt: { type: Date },
   },
   { timestamps: true }
);

const enrollmentModel = mongoose.model(enrollmentSchema);

export default enrollmentModel;
