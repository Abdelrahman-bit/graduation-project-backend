import mongoose, { Schema } from 'mongoose';
import slugify from 'slugify';

const mediaSchema = new Schema(
   {
      url: String,
      publicId: String,
      fileName: String,
      fileType: String,
      duration: Number,
   },
   { _id: false }
);

const captionSchema = new Schema(
   {
      language: { type: String, default: 'English' },
      file: mediaSchema,
   },
   { _id: false }
);

const resourceSchema = new Schema(
   {
      title: String,
      file: mediaSchema,
   },
   { _id: false }
);

const lectureSchema = new Schema(
   {
      clientId: String,
      title: { type: String, required: true, trim: true },
      description: String,
      notes: String,
      video: mediaSchema,
      attachments: [resourceSchema],
      captions: [captionSchema],
      order: { type: Number, default: 0 },
   },
   { _id: false, timestamps: false }
);

const sectionSchema = new Schema(
   {
      clientId: String,
      title: { type: String, required: true, trim: true },
      order: { type: Number, default: 0 },
      lectures: [lectureSchema],
   },
   { _id: false, timestamps: false }
);

const basicInfoSchema = new Schema(
   {
      title: { type: String, required: true, trim: true, maxlength: 80 },
      subtitle: { type: String, trim: true, maxlength: 120 },
      category: { type: String, required: true },
      subCategory: String,
      topic: String,
      primaryLanguage: { type: String, required: true },
      subtitleLanguage: String,
      level: {
         type: String,
         enum: ['beginner', 'intermediate', 'advanced', 'all-levels'],
         default: 'beginner',
      },
      durationValue: Number,
      durationUnit: {
         type: String,
         enum: ['Day', 'Week', 'Month', 'Hour'],
         default: 'Day',
      },
   },
   { _id: false, timestamps: false }
);

const advancedInfoSchema = new Schema(
   {
      thumbnail: mediaSchema,
      trailer: mediaSchema,
      description: String,
      whatYouWillLearn: [{ type: String, maxlength: 170 }],
      targetAudience: [{ type: String, maxlength: 170 }],
      requirements: [{ type: String, maxlength: 170 }],
      thumbnailUrl: String,
      trailerUrl: String,
   },
   { _id: false, timestamps: false }
);

const courseSchema = new Schema(
   {
      instructor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      slug: { type: String, unique: true },
      status: {
         type: String,
         enum: ['draft', 'review', 'published', 'rejected'],
         default: 'draft',
      },
      basicInfo: basicInfoSchema,
      advancedInfo: advancedInfoSchema,
      curriculum: {
         sections: [sectionSchema],
      },
      price: {
         amount: { type: Number, default: 0 },
         currency: { type: String, default: 'USD' },
      },
      tags: [String],
      version: { type: Number, default: 1 },
      lastPublishedAt: Date,
   },
   { timestamps: true }
);

courseSchema.pre('save', function () {
   if (this.isModified('basicInfo.title') || !this.slug) {
      const baseSlug = slugify(this.basicInfo.title || 'course', {
         lower: true,
         strict: true,
      });
      const idFragment = this._id ? this._id.toString().slice(-6) : '';
      this.slug = idFragment ? `${baseSlug}-${idFragment}` : baseSlug;
   }
});

const courseModel = mongoose.model('Course', courseSchema);
export default courseModel;
