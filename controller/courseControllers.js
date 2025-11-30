import { deleteResource } from '../utils/cloudinary.js';
import courseModel from '../models/courseModel.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';

const buildUpdateOptions = (userId) => ({
   new: true,
   runValidators: true,
   setDefaultsOnInsert: true,
   where: { instructor: userId },
});

export const createCourseDraft = catchAsync(async (req, res, next) => {
   if (!req.body.basicInfo?.title) {
      return next(new AppError('Course title is required', 400));
   }

   const course = await courseModel.create({
      instructor: req.user._id,
      basicInfo: req.body.basicInfo,
      advancedInfo: req.body.advancedInfo || {},
      curriculum: req.body.curriculum || { sections: [] },
   });

   res.status(201).json({
      status: 'success',
      data: course,
   });
});

export const updateCourseBasicInfo = catchAsync(async (req, res, next) => {
   const { courseId } = req.params;
   const updatedCourse = await courseModel.findOneAndUpdate(
      { _id: courseId, instructor: req.user._id },
      { basicInfo: req.body.basicInfo },
      buildUpdateOptions(req.user._id)
   );

   if (!updatedCourse) {
      return next(new AppError('Course not found', 404));
   }

   res.status(200).json({
      status: 'success',
      data: updatedCourse,
   });
});

export const updateCourseAdvancedInfo = catchAsync(async (req, res, next) => {
   const { courseId } = req.params;
   const updatedCourse = await courseModel.findOneAndUpdate(
      { _id: courseId, instructor: req.user._id },
      { advancedInfo: req.body.advancedInfo },
      buildUpdateOptions(req.user._id)
   );

   if (!updatedCourse) {
      return next(new AppError('Course not found', 404));
   }

   res.status(200).json({
      status: 'success',
      data: updatedCourse,
   });
});

export const updateCourseCurriculum = catchAsync(async (req, res, next) => {
   const { courseId } = req.params;
   const updatedCourse = await courseModel.findOneAndUpdate(
      { _id: courseId, instructor: req.user._id },
      { curriculum: req.body.curriculum },
      buildUpdateOptions(req.user._id)
   );

   if (!updatedCourse) {
      return next(new AppError('Course not found', 404));
   }

   res.status(200).json({
      status: 'success',
      data: updatedCourse,
   });
});

export const submitCourseForReview = catchAsync(async (req, res, next) => {
   const { courseId } = req.params;
   const updatedCourse = await courseModel.findOneAndUpdate(
      { _id: courseId, instructor: req.user._id },
      { status: req.body.status || 'review' },
      buildUpdateOptions(req.user._id)
   );

   if (!updatedCourse) {
      return next(new AppError('Course not found', 404));
   }

   res.status(200).json({
      status: 'success',
      data: updatedCourse,
   });
});

export const getCourseById = catchAsync(async (req, res, next) => {
   const { courseId } = req.params;
   const course = await courseModel
      .findById(courseId)
      .populate('instructor', 'name email');

   if (!course) {
      return next(new AppError('Course not found', 404));
   }

   res.status(200).json({
      status: 'success',
      data: course,
   });
});

export const getInstructorCourses = catchAsync(async (req, res) => {
   const courses = await courseModel
      .find({ instructor: req.user._id })
      .sort({ updatedAt: -1 });

   res.status(200).json({
      status: 'success',
      results: courses.length,
      data: courses,
   });
});

export const getInstructorDraftCourses = catchAsync(async (req, res) => {
   const courses = await courseModel
      .find({ instructor: req.user._id, status: 'draft' })
      .sort({ updatedAt: -1 });

   res.status(200).json({
      status: 'success',
      results: courses.length,
      data: courses,
   });
});

export const deleteCourse = catchAsync(async (req, res, next) => {
   const { courseId } = req.params;
   const course = await courseModel.findById(courseId);

   if (!course) {
      return next(new AppError('Course not found', 404));
   }

   if (
      course.instructor.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
   ) {
      return next(
         new AppError('You are not authorized to delete this course', 403)
      );
   }

   // Delete resources from Cloudinary
   const { advancedInfo, curriculum } = course;
   if (advancedInfo.thumbnail?.publicId) {
      await deleteResource(advancedInfo.thumbnail.publicId, 'image');
   }
   if (advancedInfo.trailer?.publicId) {
      await deleteResource(advancedInfo.trailer.publicId, 'video');
   }

   for (const section of curriculum.sections) {
      for (const lecture of section.lectures) {
         if (lecture.video?.publicId) {
            await deleteResource(lecture.video.publicId, 'video');
         }
         if (lecture.attachments) {
            for (const attachment of lecture.attachments) {
               if (attachment.file?.publicId) {
                  await deleteResource(attachment.file.publicId, 'raw');
               }
            }
         }
      }
   }

   await courseModel.findByIdAndDelete(courseId);

   res.status(204).json({
      status: 'success',
      data: null,
   });
});
