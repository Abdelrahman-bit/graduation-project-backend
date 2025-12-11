import mongoose, { Schema } from 'mongoose';

const wishlistSchema = new Schema(
   {
      user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
   },
   { timestamps: true }
);

// Prevent duplicate wishlist items
wishlistSchema.index({ user: 1, course: 1 }, { unique: true });

const wishlistModel = mongoose.model('Wishlist', wishlistSchema);

export default wishlistModel;
