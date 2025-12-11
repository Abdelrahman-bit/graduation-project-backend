import mongoose, { Schema } from 'mongoose';

const hallSchema = new Schema(
   {
      name: {
         type: String,
         required: [true, 'Hall name is required'],
         trim: true,
      },

      thumbnail: {
         type: String,
      },

      description: {
         type: String,
         maxlength: 500,
      },

      capacity: {
         type: Number,
         required: true,
         validate: {
            validator: Number.isInteger,
            message: 'Capacity must be an integer number',
         },
         min: [5, 'Capacity must be at least 5'],
         max: [1000, 'Capacity cannot exceed 1000'],
      },

      facilities: {
         hasAC: { type: Boolean, default: false },
         hasWhiteboard: { type: Boolean, default: false },
         hasInteractiveScreen: { type: Boolean, default: false },
         hasSoundSystem: { type: Boolean, default: false },
         hasMic: { type: Boolean, default: false },
         hasProjector: { type: Boolean, default: false },
         hasWifi: { type: Boolean, default: true },
      },

      hourlyPrice: {
         type: Number,
         min: [100, 'hourlyPrice must be at least 100 EGP/hour'],
         required: true,
      },

      availability: [
         {
            type: Schema.Types.ObjectId,
            ref: 'Slot',
         },
      ],

      isBookable: {
         type: Boolean,
         default: true,
      },
   },
   { timestamps: true }
);

const hallModel = mongoose.model('Hall', hallSchema);

export default hallModel;
