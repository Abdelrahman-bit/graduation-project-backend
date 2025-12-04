import mongoose, { Schema } from 'mongoose';

// a schema that defines the avalible Halls slots to be booked
const slotSchema = new Schema({
   hall: { type: mongoose.Schema.Types.ObjectId, ref: 'Hall' },
   startTime: {
      type: Date,
      required: true,
      validate: {
         validator: (value) => value > Date.now(),
         message: 'Start time must be in the future.',
      },
   },
   endTime: {
      type: Date,
      required: true,
      validate: {
         validator: function (value) {
            // this → refers to the current document
            return value > this.startTime;
         },
         message: "Endtime can't be in the past",
      },
   },
});

// document will auto removed from the DB
slotSchema.index({ endTime: 1 }, { expireAfterSeconds: 0 });

const slotmodel = mongoose.model('Slot', slotSchema);

export default slotmodel;
