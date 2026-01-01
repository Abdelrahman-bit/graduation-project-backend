import userModel from '../models/usersModel.js';
import courseModel from '../models/courseModel.js';
import enrollmentModel from '../models/enrollmentModel.js';
import ratingModel from '../models/ratingModel.js';
import catchAsync from '../utils/catchAsync.js';

// Public endpoint to get platform statistics for homepage
export const getPublicStats = catchAsync(async (req, res, next) => {
   const [totalStudents, activeCourses, totalEnrollments] = await Promise.all([
      userModel.countDocuments({ role: 'student' }),
      courseModel.countDocuments({ status: 'published' }),
      enrollmentModel.countDocuments(),
   ]);

   // Calculate average rating from Rating model
   const ratingStats = await ratingModel.aggregate([
      {
         $group: {
            _id: null,
            averageRating: { $avg: '$rating' },
            totalRatings: { $sum: 1 },
         },
      },
   ]);

   const avgRating =
      ratingStats.length > 0 && ratingStats[0].totalRatings > 0
         ? ratingStats[0].averageRating.toFixed(1)
         : '4.8'; // Default fallback if no ratings yet

   res.status(200).json({
      status: 'success',
      data: {
         totalStudents,
         activeCourses,
         totalEnrollments,
         averageRating: parseFloat(avgRating),
      },
   });
});
