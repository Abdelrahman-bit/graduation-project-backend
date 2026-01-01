import mongoose, { Schema } from 'mongoose';

const ratingSchema = new Schema(
   {
      student: {
         type: Schema.Types.ObjectId,
         ref: 'User',
         required: [true, 'Rating must belong to a student'],
      },
      course: {
         type: Schema.Types.ObjectId,
         ref: 'Course',
         required: [true, 'Rating must belong to a course'],
      },
      rating: {
         type: Number,
         required: [true, 'Rating is required'],
         min: [1, 'Rating must be at least 1'],
         max: [5, 'Rating cannot exceed 5'],
      },
      review: {
         type: String,
         trim: true,
         maxlength: [1000, 'Review cannot exceed 1000 characters'],
      },
   },
   { timestamps: true }
);

// Ensure one rating per student per course
ratingSchema.index({ student: 1, course: 1 }, { unique: true });

// Index for efficient course rating queries
ratingSchema.index({ course: 1 });

const ratingModel = mongoose.model('Rating', ratingSchema);

export default ratingModel;
