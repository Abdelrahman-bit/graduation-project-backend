import mongoose from 'mongoose';
import crypto from 'crypto';

const accessKeySchema = new mongoose.Schema({
   key: { type: String, unique: true, required: true },
   course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
   },
   createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
   }, // instructor
   durationDays: { type: Number, default: 30 }, // how many days it give access
   usesLimit: { type: Number, default: 1 }, // how many times user can use it => 1 for simplicity
   usedCount: { type: Number, default: 0 }, // track usage
   expiresAt: { type: Date, default: undefined }, // code expiry date to avoid DB over Usage
   createdAt: { type: Date, default: Date.now },
});

// TTL index → delete document automatically
accessKeySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Random Code Generator
// take a code length and use crypto to generate a len-digit access code (ex 7XY5FG3)
accessKeySchema.statics.generateKeyCode = function (len = 8) {
   return crypto
      .randomBytes(len)
      .toString('base64')
      .replace(/[^A-Za-z0-9]/g, '')
      .slice(0, len)
      .toUpperCase();
};

const accessKeyModel = mongoose.model('AccessKey', accessKeySchema);

export default accessKeyModel;
