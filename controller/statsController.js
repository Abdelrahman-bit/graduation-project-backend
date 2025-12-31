import userModel from '../models/usersModel.js';
import courseModel from '../models/courseModel.js';
import enrollmentModel from '../models/enrollmentModel.js';
import catchAsync from '../utils/catchAsync.js';

// Public endpoint to get platform statistics for homepage
export const getPublicStats = catchAsync(async (req, res, next) => {
   const [totalStudents, activeCourses, totalEnrollments] = await Promise.all([
      userModel.countDocuments({ role: 'student' }),
      courseModel.countDocuments({ status: 'published' }),
      enrollmentModel.countDocuments(),
   ]);

   // Calculate average rating from courses
   const courses = await courseModel.find(
      { status: 'published' },
      'ratings ratingsAverage'
   );

   const avgRating =
      courses.length > 0
         ? (
              courses.reduce(
                 (sum, course) => sum + (course.ratingsAverage || 0),
                 0
              ) / courses.length
           ).toFixed(1)
         : '4.8';

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
