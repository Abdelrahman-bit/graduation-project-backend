import mongoose, { Schema } from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcrypt';

const instructorApplicationSchema = new Schema({
   name: {
      type: String,
      required: [true, 'User name is required'],
      minlength: [3, 'Name must be at least 3 characters'],
   },
   email: {
      type: String,
      required: [true, 'User email is required'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please enter a valid email'],
   },
   phone: {
      type: String,
      required: [true, 'Phone number is required'],
   },
   status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
   },
   createdAt: {
      type: Date,
      default: Date.now,
   },
});

const applicationModel = mongoose.model(
   'ApplicationModel',
   instructorApplicationSchema
);

export default applicationModel;
