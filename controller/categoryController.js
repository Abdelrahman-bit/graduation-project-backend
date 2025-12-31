import Category from '../models/categoryModel.js';
import courseModel from '../models/courseModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

// Public Controllers
// ==================

// @desc    Get all active categories with course counts
// @route   GET /api/categories
// @access  Public
export const getCategories = catchAsync(async (req, res, next) => {
   const categories = await Category.aggregate([
      { $match: { isActive: true } },
      {
         $lookup: {
            from: 'courses',
            let: { categoryName: '$name' },
            pipeline: [
               {
                  $match: {
                     status: 'published',
                     $expr: {
                        $eq: ['$basicInfo.category', '$$categoryName'],
                     },
                  },
               },
            ],
            as: 'courses',
         },
      },
      {
         $addFields: {
            courseCount: { $size: '$courses' },
         },
      },
      {
         $project: {
            courses: 0,
         },
      },
      { $sort: { order: 1, name: 1 } },
   ]);

   res.status(200).json({
      status: 'success',
      results: categories.length,
      data: categories,
   });
});

// @desc    Get category by slug
// @route   GET /api/categories/:slug
// @access  Public
export const getCategoryBySlug = catchAsync(async (req, res, next) => {
   const { slug } = req.params;

   const category = await Category.findOne({ slug, isActive: true });

   if (!category) {
      return next(new AppError('Category not found', 404));
   }

   // Get course count
   const courseCount = await courseModel.countDocuments({
      'basicInfo.category': slug,
      status: 'published',
   });

   res.status(200).json({
      status: 'success',
      data: {
         ...category.toObject(),
         courseCount,
      },
   });
});

// Admin Controllers
// =================

// @desc    Get all categories (including inactive) for admin
// @route   GET /api/admin/categories
// @access  Admin
export const getAllCategories = catchAsync(async (req, res, next) => {
   const categories = await Category.aggregate([
      {
         $lookup: {
            from: 'courses',
            let: { categorySlug: '$slug' },
            pipeline: [
               {
                  $match: {
                     $expr: { $eq: ['$basicInfo.category', '$$categorySlug'] },
                  },
               },
            ],
            as: 'courses',
         },
      },
      {
         $addFields: {
            courseCount: { $size: '$courses' },
         },
      },
      {
         $project: {
            courses: 0,
         },
      },
      { $sort: { order: 1, name: 1 } },
   ]);

   res.status(200).json({
      status: 'success',
      results: categories.length,
      data: categories,
   });
});

// @desc    Create new category
// @route   POST /api/admin/categories
// @access  Admin
export const createCategory = catchAsync(async (req, res, next) => {
   const { name, description, icon, iconColor, backgroundColor, order } =
      req.body;

   // Validate name
   if (!name || name.trim().length === 0) {
      return next(new AppError('Category name is required', 400));
   }

   // Check if category with same name exists (escape special regex characters)
   const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
   const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${escapedName}$`, 'i') },
   });

   if (existingCategory) {
      return next(new AppError('Category with this name already exists', 409));
   }

   try {
      const category = await Category.create({
         name,
         description,
         icon,
         iconColor,
         backgroundColor,
         order,
      });

      res.status(201).json({
         status: 'success',
         data: category,
      });
   } catch (error) {
      console.error('[createCategory] Error creating category:', error);
      return next(
         new AppError(error.message || 'Error creating category', 500)
      );
   }
});

// @desc    Update category
// @route   PUT /api/admin/categories/:id
// @access  Admin
export const updateCategory = catchAsync(async (req, res, next) => {
   const { id } = req.params;
   const { name, description, icon, iconColor, backgroundColor, order } =
      req.body;

   const category = await Category.findById(id);

   if (!category) {
      return next(new AppError('Category not found', 404));
   }

   // Check if new name conflicts with existing category
   if (name && name !== category.name) {
      const existingCategory = await Category.findOne({
         _id: { $ne: id },
         name: { $regex: new RegExp(`^${name}$`, 'i') },
      });

      if (existingCategory) {
         return next(
            new AppError('Category with this name already exists', 409)
         );
      }
   }

   // Update fields
   if (name) category.name = name;
   if (description !== undefined) category.description = description;
   if (icon) category.icon = icon;
   if (iconColor) category.iconColor = iconColor;
   if (backgroundColor) category.backgroundColor = backgroundColor;
   if (order !== undefined) category.order = order;

   await category.save();

   res.status(200).json({
      status: 'success',
      data: category,
   });
});

// @desc    Delete category
// @route   DELETE /api/admin/categories/:id
// @access  Admin
export const deleteCategory = catchAsync(async (req, res, next) => {
   const { id } = req.params;

   const category = await Category.findById(id);

   if (!category) {
      return next(new AppError('Category not found', 404));
   }

   // Check if category has courses
   const courseCount = await courseModel.countDocuments({
      'basicInfo.category': category.slug,
   });

   if (courseCount > 0) {
      return next(
         new AppError(
            `Cannot delete category with ${courseCount} course(s). Please reassign or delete the courses first.`,
            422
         )
      );
   }

   await Category.findByIdAndDelete(id);

   res.status(204).json({
      status: 'success',
      data: null,
   });
});

// @desc    Toggle category active status
// @route   PATCH /api/admin/categories/:id/toggle
// @access  Admin
export const toggleCategoryStatus = catchAsync(async (req, res, next) => {
   const { id } = req.params;

   const category = await Category.findById(id);

   if (!category) {
      return next(new AppError('Category not found', 404));
   }

   category.isActive = !category.isActive;
   await category.save();

   res.status(200).json({
      status: 'success',
      data: category,
   });
});

// @desc    Reorder categories
// @route   PATCH /api/admin/categories/reorder
// @access  Admin
export const reorderCategories = catchAsync(async (req, res, next) => {
   const { categoryOrders } = req.body; // Array of { id, order }

   if (!Array.isArray(categoryOrders)) {
      return next(new AppError('categoryOrders must be an array', 400));
   }

   // Update all categories in bulk
   const bulkOps = categoryOrders.map(({ id, order }) => ({
      updateOne: {
         filter: { _id: id },
         update: { order },
      },
   }));

   await Category.bulkWrite(bulkOps);

   res.status(200).json({
      status: 'success',
      message: 'Categories reordered successfully',
   });
});
