import mongoose, { Schema } from 'mongoose';

const bookingSchema = new Schema(
   {
      user: {
         type: Schema.Types.ObjectId,
         ref: 'User',
         required: [true, 'Instructor id Is Required'],
      },
      hall: {
         type: Schema.Types.ObjectId,
         ref: 'Hall',
         required: [true, 'Hall id Is Required'],
      },
      bookedTime: {
         startTime: { type: Date, required: [true, 'Start time is required'] },
         endTime: { type: Date, required: [true, 'End time is required'] },
      },
   },
   { timestamps: true }
);

const bookingModel = mongoose.model('Booking', bookingSchema);

export default bookingModel;
