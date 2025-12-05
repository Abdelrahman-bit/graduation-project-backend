import mongoose from 'mongoose';
import validator from 'validator';

const applicationSchema = new mongoose.Schema({
   name: {
      type: String,
      required: [true, 'Please provide your name'],
   },
   email: {
      type: String,
      required: [true, 'Please provide your email'],
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email'],
   },
   phone: {
      type: String,
      required: [true, 'Please provide your phone number'],
   },
   status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
   },
   createdAt: {
      type: Date,
      default: Date.now(),
   },
});

const Application = mongoose.model('Application', applicationSchema);

export default Application;
