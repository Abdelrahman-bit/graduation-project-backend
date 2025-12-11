import { deleteResource } from '../utils/cloudinary.js';
import courseModel from '../models/courseModel.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';
import mongoose from 'mongoose';
import {
   processCourseForEmbedding,
   deleteCourseEmbeddings,
} from '../services/ai/embeddingService.js';

const buildUpdateOptions = (userId) => ({
   new: true,
   runValidators: true,
   setDefaultsOnInsert: true,
   where: { instructor: userId },
});

export const createCourseDraft = catchAsync(async (req, res, next) => {
   console.log(
      `[CourseController] Creating draft course for user ${req.user?._id}`
   );
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
   console.log(
      `[CourseController] Updating basic info for course ${req.params.courseId}`
   );
   const { courseId } = req.params;
   const updatedCourse = await courseModel
      .findOneAndUpdate(
         { _id: courseId, instructor: req.user._id },
         { basicInfo: req.body.basicInfo },
         buildUpdateOptions(req.user._id)
      )
      .select('-curriculum');

   if (!updatedCourse) {
      return next(new AppError('Course not found', 404));
   }

   // Sync AI Embeddings
   if (updatedCourse.status === 'published') {
      await processCourseForEmbedding(updatedCourse);
   }

   res.status(200).json({
      status: 'success',
      data: updatedCourse,
   });
});

export const updateCourseAdvancedInfo = catchAsync(async (req, res, next) => {
   const { courseId } = req.params;
   const updatedCourse = await courseModel
      .findOneAndUpdate(
         { _id: courseId, instructor: req.user._id },
         { advancedInfo: req.body.advancedInfo },
         buildUpdateOptions(req.user._id)
      )
      .select('-curriculum');

   if (!updatedCourse) {
      return next(new AppError('Course not found', 404));
   }

   // Sync AI Embeddings
   if (updatedCourse.status === 'published') {
      await processCourseForEmbedding(updatedCourse);
   }

   res.status(200).json({
      status: 'success',
      data: updatedCourse,
   });
});

export const updateCourseCurriculum = catchAsync(async (req, res, next) => {
   const { courseId } = req.params;
   const updatedCourse = await courseModel
      .findOneAndUpdate(
         { _id: courseId, instructor: req.user._id },
         { curriculum: req.body.curriculum },
         buildUpdateOptions(req.user._id)
      )
      .select('curriculum');

   if (!updatedCourse) {
      return next(new AppError('Course not found', 404));
   }

   // Sync AI Embeddings
   if (updatedCourse.status === 'published') {
      await processCourseForEmbedding(updatedCourse);
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

   // Sync AI Embeddings
   if (updatedCourse.status === 'published') {
      await processCourseForEmbedding(updatedCourse);
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
      .populate('instructor', 'firstname lastname email avatar');

   if (!course) {
      return next(new AppError('Course not found', 404));
   }

   res.status(200).json({
      status: 'success',
      data: course,
   });
});

export const getInstructorCourses = catchAsync(async (req, res) => {
   console.log(
      `[CourseController] Getting courses for instructor ${req.user?._id}`
   );
   const courses = await courseModel.aggregate([
      { $match: { instructor: req.user._id } },
      {
         $lookup: {
            from: 'enrollments',
            localField: '_id',
            foreignField: 'course',
            as: 'enrollments',
         },
      },
      {
         $addFields: {
            students: {
               $size: {
                  $filter: {
                     input: '$enrollments',
                     as: 'enrollment',
                     cond: { $eq: ['$$enrollment.status', 'enrolled'] },
                  },
               },
            },
         },
      },
      { $project: { enrollments: 0, curriculum: 0 } },
      { $sort: { updatedAt: -1 } },
   ]);

   res.status(200).json({
      status: 'success',
      results: courses.length,
      data: courses,
   });
});

export const getInstructorDraftCourses = catchAsync(async (req, res) => {
   const courses = await courseModel
      .find({ instructor: req.user._id, status: 'draft' })
      .select('-curriculum')
      .sort({ updatedAt: -1 });

   res.status(200).json({
      status: 'success',
      results: courses.length,
      data: courses,
   });
});

export const deleteCourse = catchAsync(async (req, res, next) => {
   console.log(`[CourseController] Deleting course ${req.params.courseId}`);
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

   await deleteCourseEmbeddings(courseId);
   await courseModel.findByIdAndDelete(courseId);

   res.status(204).json({
      status: 'success',
      data: null,
   });
});

export const getAllCourses = catchAsync(async (req, res) => {
   const courses = await courseModel
      .find({ status: 'published' })
      .select('-curriculum')
      .populate('instructor', 'firstname lastname avatar');
   res.status(200).json({
      status: 'success',
      results: courses.length,
      data: courses,
   });
});

export const getPublicInstructorCourses = catchAsync(async (req, res, next) => {
   const { instructorId } = req.params;

   // Validate ObjectId
   if (!mongoose.Types.ObjectId.isValid(instructorId)) {
      return next(new AppError('Invalid instructor ID', 400));
   }

   const courses = await courseModel.aggregate([
      {
         $match: {
            instructor: new mongoose.Types.ObjectId(instructorId),
            status: 'published',
         },
      },
      {
         $lookup: {
            from: 'enrollments',
            localField: '_id',
            foreignField: 'course',
            as: 'enrollments',
         },
      },
      {
         $addFields: {
            students: {
               $size: {
                  $filter: {
                     input: '$enrollments',
                     as: 'enrollment',
                     cond: { $eq: ['$$enrollment.status', 'enrolled'] },
                  },
               },
            },
         },
      },
      // Populate instructor not directly possible in aggregate without lookup, but usually we just need basic info.
      // However, frontend page fetches instructor profile separately, so we might not need to deeply populate instructor here
      {
         $lookup: {
            from: 'users',
            localField: 'instructor',
            foreignField: '_id',
            as: 'instructorInfo',
         },
      },
      {
         $unwind: '$instructorInfo',
      },
      // Shape the data to match expected output (instructor object instead of array)
      {
         $addFields: {
            instructor: {
               firstname: '$instructorInfo.firstname',
               lastname: '$instructorInfo.lastname',
               avatar: '$instructorInfo.avatar',
               title: '$instructorInfo.title',
            },
         },
      },
      {
         $project: {
            enrollments: 0,
            curriculum: 0,
            instructorInfo: 0,
         },
      },
      { $sort: { updatedAt: -1 } },
   ]);

   res.status(200).json({
      status: 'success',
      results: courses.length,
      data: courses,
   });
});
