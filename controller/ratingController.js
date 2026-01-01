import mongoose from 'mongoose';
import ratingModel from '../models/ratingModel.js';
import courseModel from '../models/courseModel.js';
import enrollmentModel from '../models/enrollmentModel.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';

/**
 * Submit or update a rating for a course
 * Students can only rate courses they are enrolled in
 * Uses upsert to handle both create and update
 */
export const submitRating = catchAsync(async (req, res, next) => {
   const { courseId } = req.params;
   const { rating, review } = req.body;
   const studentId = req.user._id;

   // Validate rating value
   if (!rating || rating < 1 || rating > 5) {
      return next(new AppError('Rating must be between 1 and 5', 400));
   }

   // Check if course exists
   const course = await courseModel.findById(courseId);
   if (!course) {
      return next(new AppError('Course not found', 404));
   }

   // Check if student is enrolled in the course
   const enrollment = await enrollmentModel.findOne({
      student: studentId,
      course: courseId,
      isDeleted: false,
   });

   if (!enrollment) {
      return next(
         new AppError('You must be enrolled in this course to rate it', 403)
      );
   }

   // Upsert: create or update the rating
   const updatedRating = await ratingModel.findOneAndUpdate(
      { student: studentId, course: courseId },
      { rating, review: review?.trim() || undefined },
      { new: true, upsert: true, runValidators: true }
   );

   res.status(200).json({
      status: 'success',
      data: updatedRating,
   });
});

/**
 * Get the current student's rating for a specific course
 */
export const getMyRating = catchAsync(async (req, res, next) => {
   const { courseId } = req.params;
   const studentId = req.user._id;

   const rating = await ratingModel.findOne({
      student: studentId,
      course: courseId,
   });

   res.status(200).json({
      status: 'success',
      data: rating, // null if not rated yet
   });
});

/**
 * Get all ratings for a course (for instructor/admin)
 */
export const getCourseRatings = catchAsync(async (req, res, next) => {
   const { courseId } = req.params;
   const { page = 1, limit = 10 } = req.query;

   const skip = (parseInt(page) - 1) * parseInt(limit);

   const [ratings, total] = await Promise.all([
      ratingModel
         .find({ course: courseId })
         .populate('student', 'firstname lastname avatar')
         .sort({ createdAt: -1 })
         .skip(skip)
         .limit(parseInt(limit)),
      ratingModel.countDocuments({ course: courseId }),
   ]);

   res.status(200).json({
      status: 'success',
      results: ratings.length,
      total,
      data: ratings,
   });
});

/**
 * Get rating statistics for a course
 * Returns average rating, total count, and distribution
 */
export const getCourseRatingStats = catchAsync(async (req, res, next) => {
   const { courseId } = req.params;

   // Convert string courseId to ObjectId for aggregation
   const courseObjectId = new mongoose.Types.ObjectId(courseId);

   const stats = await ratingModel.aggregate([
      { $match: { course: courseObjectId } },
      {
         $group: {
            _id: null,
            averageRating: { $avg: '$rating' },
            totalRatings: { $sum: 1 },
            star5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
            star4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
            star3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
            star2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
            star1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
         },
      },
   ]);

   if (stats.length === 0) {
      return res.status(200).json({
         status: 'success',
         data: {
            averageRating: 0,
            totalRatings: 0,
            distribution: [
               { stars: 5, count: 0, percent: 0 },
               { stars: 4, count: 0, percent: 0 },
               { stars: 3, count: 0, percent: 0 },
               { stars: 2, count: 0, percent: 0 },
               { stars: 1, count: 0, percent: 0 },
            ],
         },
      });
   }

   const { averageRating, totalRatings, star5, star4, star3, star2, star1 } =
      stats[0];

   const distribution = [
      {
         stars: 5,
         count: star5,
         percent: Math.round((star5 / totalRatings) * 100),
      },
      {
         stars: 4,
         count: star4,
         percent: Math.round((star4 / totalRatings) * 100),
      },
      {
         stars: 3,
         count: star3,
         percent: Math.round((star3 / totalRatings) * 100),
      },
      {
         stars: 2,
         count: star2,
         percent: Math.round((star2 / totalRatings) * 100),
      },
      {
         stars: 1,
         count: star1,
         percent: Math.round((star1 / totalRatings) * 100),
      },
   ];

   res.status(200).json({
      status: 'success',
      data: {
         averageRating: parseFloat(averageRating.toFixed(1)),
         totalRatings,
         distribution,
      },
   });
});

/**
 * Helper function to get rating stats for multiple courses
 * Used internally by other controllers
 */
export const getRatingStatsForCourses = async (courseIds) => {
   const stats = await ratingModel.aggregate([
      {
         $match: {
            course: { $in: courseIds },
         },
      },
      {
         $group: {
            _id: '$course',
            averageRating: { $avg: '$rating' },
            totalRatings: { $sum: 1 },
         },
      },
   ]);

   // Convert to a map for easy lookup
   const statsMap = new Map();
   stats.forEach((s) => {
      statsMap.set(s._id.toString(), {
         averageRating: parseFloat(s.averageRating.toFixed(1)),
         totalRatings: s.totalRatings,
      });
   });

   return statsMap;
};

/**
 * Get instructor's overall rating stats
 * Aggregates ratings across all instructor's courses
 */
export const getInstructorRatingStats = async (instructorId) => {
   // Get all courses by this instructor
   const courses = await courseModel
      .find({ instructor: instructorId, status: 'published' })
      .select('_id');

   const courseIds = courses.map((c) => c._id);

   if (courseIds.length === 0) {
      return {
         averageRating: 0,
         totalRatings: 0,
         distribution: [
            { stars: 5, count: 0, percent: 0 },
            { stars: 4, count: 0, percent: 0 },
            { stars: 3, count: 0, percent: 0 },
            { stars: 2, count: 0, percent: 0 },
            { stars: 1, count: 0, percent: 0 },
         ],
         trend: [],
      };
   }

   // Get overall stats
   const overallStats = await ratingModel.aggregate([
      { $match: { course: { $in: courseIds } } },
      {
         $group: {
            _id: null,
            averageRating: { $avg: '$rating' },
            totalRatings: { $sum: 1 },
            star5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
            star4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
            star3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
            star2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
            star1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
         },
      },
   ]);

   // Get rating trend (last 7 days average)
   const sevenDaysAgo = new Date();
   sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

   const trendData = await ratingModel.aggregate([
      {
         $match: {
            course: { $in: courseIds },
            createdAt: { $gte: sevenDaysAgo },
         },
      },
      {
         $group: {
            _id: {
               $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            avgRating: { $avg: '$rating' },
         },
      },
      { $sort: { _id: 1 } },
   ]);

   if (overallStats.length === 0) {
      return {
         averageRating: 0,
         totalRatings: 0,
         distribution: [
            { stars: 5, count: 0, percent: 0 },
            { stars: 4, count: 0, percent: 0 },
            { stars: 3, count: 0, percent: 0 },
            { stars: 2, count: 0, percent: 0 },
            { stars: 1, count: 0, percent: 0 },
         ],
         trend: [],
      };
   }

   const { averageRating, totalRatings, star5, star4, star3, star2, star1 } =
      overallStats[0];

   const distribution = [
      {
         stars: 5,
         count: star5,
         percent: Math.round((star5 / totalRatings) * 100),
      },
      {
         stars: 4,
         count: star4,
         percent: Math.round((star4 / totalRatings) * 100),
      },
      {
         stars: 3,
         count: star3,
         percent: Math.round((star3 / totalRatings) * 100),
      },
      {
         stars: 2,
         count: star2,
         percent: Math.round((star2 / totalRatings) * 100),
      },
      {
         stars: 1,
         count: star1,
         percent: Math.round((star1 / totalRatings) * 100),
      },
   ];

   const trend = trendData.map((d) => ({
      date: d._id,
      value: parseFloat(d.avgRating.toFixed(1)),
   }));

   return {
      averageRating: parseFloat(averageRating.toFixed(1)),
      totalRatings,
      distribution,
      trend,
   };
};
