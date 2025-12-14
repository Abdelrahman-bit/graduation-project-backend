import mongoose, { Schema } from 'mongoose';

const bookingSchema = new Schema({
   user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
   course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
   hall: { type: Schema.Types.ObjectId, ref: 'Hall', required: true },
   slot: { type: Schema.Types.ObjectId, ref: 'Slot', required: true },
   createdAt: {
      type: Date,
      default: Date.now,
   },
});

// Prevent double booking on the same slot
bookingSchema.index({ slot: 1 }, { unique: true });

const bookingModel = mongoose.model('Booking', bookingSchema);

export default bookingModel;
