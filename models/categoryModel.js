import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
   {
      name: {
         type: String,
         required: [true, 'Category name is required'],
         unique: true,
         trim: true,
         minlength: [2, 'Category name must be at least 2 characters'],
         maxlength: [50, 'Category name must not exceed 50 characters'],
      },
      slug: {
         type: String,
         required: false, // Auto-generated from name in pre-save hook
         unique: true,
         lowercase: true,
         trim: true,
      },
      description: {
         type: String,
         trim: true,
         maxlength: [500, 'Description must not exceed 500 characters'],
      },
      icon: {
         type: String,
         default: 'FolderIcon',
      },
      iconColor: {
         type: String,
         default: '#6366f1',
         validate: {
            validator: function (v) {
               return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
            },
            message: 'Invalid hex color format',
         },
      },
      backgroundColor: {
         type: String,
         default: '#eef2ff',
         validate: {
            validator: function (v) {
               return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
            },
            message: 'Invalid hex color format',
         },
      },
      isActive: {
         type: Boolean,
         default: true,
      },
      order: {
         type: Number,
         default: 0,
      },
   },
   {
      timestamps: true,
      toJSON: { virtuals: true },
      toObject: { virtuals: true },
   }
);

// Indexes for performance (slug index created automatically by unique: true)
categorySchema.index({ isActive: 1 });
categorySchema.index({ order: 1 });

// Virtual field to count courses
categorySchema.virtual('courseCount', {
   ref: 'Course',
   localField: 'slug',
   foreignField: 'basicInfo.category',
   count: true,
});

// Pre-save middleware to generate slug from name
categorySchema.pre('save', async function () {
   if (this.isModified('name')) {
      this.slug = this.name
         .toLowerCase()
         .replace(/\s+/g, '_')
         .replace(/[^\w_]/g, '');
   }

   // Set default icon if empty
   if (!this.icon || this.icon.trim() === '') {
      this.icon = 'Folder';
   }
});

// Static method to get active categories with course counts
categorySchema.statics.getActiveCategories = async function () {
   return this.find({ isActive: true })
      .sort({ order: 1, name: 1 })
      .populate('courseCount');
};

const Category = mongoose.model('Category', categorySchema);

export default Category;
