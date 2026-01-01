import applicationModel from '../models/applicationModel.js';
import userModel from '../models/usersModel.js';
import courseModel from '../models/courseModel.js';
import bookingModel from '../models/BookingModel.js';
import enrollmentModel from '../models/enrollmentModel.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';
import crypto from 'crypto';
import sendEmail from '../utils/sendEmail.js';
import { getInstructorRatingStats } from './ratingController.js';

export const getApplicationRequests = catchAsync(async (req, res, next) => {
   const applications = await applicationModel.find({ status: 'pending' });

   res.status(200).json({
      status: 'succuss',
      applications,
   });
});

export const getDashboardStats = catchAsync(async (req, res, next) => {
   // 1. Basic Counts
   const [pendingRequests, totalInstructors, totalStudents, activeCourses] =
      await Promise.all([
         applicationModel.countDocuments({ status: 'pending' }),
         userModel.countDocuments({ role: 'instructor' }),
         userModel.countDocuments({ role: 'student' }),
         courseModel.countDocuments({ status: 'published' }),
      ]);

   // 2. Growth Chart (Last 6 months)
   const growthStats = await userModel.aggregate([
      {
         $match: {
            createdAt: {
               $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)),
            },
         },
      },
      {
         $group: {
            _id: {
               month: { $month: '$createdAt' },
               year: { $year: '$createdAt' },
            },
            students: {
               $sum: { $cond: [{ $eq: ['$role', 'student'] }, 1, 0] },
            },
            instructors: {
               $sum: { $cond: [{ $eq: ['$role', 'instructor'] }, 1, 0] },
            },
            date: { $first: '$createdAt' },
         },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
   ]);

   const growthChart = growthStats.map((stat) => ({
      name: new Date(stat.date).toLocaleString('default', { month: 'short' }),
      students: stat.students,
      instructors: stat.instructors,
   }));

   // 3. Recent Bookings (Last 5)
   const recentBookingsRaw = await bookingModel
      .find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('hall', 'name')
      .populate('user', 'firstname lastname');

   const recentBookings = recentBookingsRaw.map((b) => ({
      id: b._id,
      hall: b.hall?.name || 'Unknown Hall',
      instructor: b.user ? `${b.user.firstname} ${b.user.lastname}` : 'Unknown',
      date: b.createdAt,
   }));

   // 4. Recent Activities (Merged from multiple sources)
   // Get recent 5 from each source and sort in memory
   const [recentCourses, recentUsers, recentApps] = await Promise.all([
      courseModel
         .find()
         .sort({ createdAt: -1 })
         .limit(5)
         .populate('instructor', 'firstname lastname'),
      userModel.find().sort({ createdAt: -1 }).limit(5),
      applicationModel.find().sort({ createdAt: -1 }).limit(5),
   ]);

   const activities = [
      ...recentCourses.map((c) => ({
         id: c._id,
         type: 'new_course',
         user: c.instructor
            ? `${c.instructor.firstname} ${c.instructor.lastname}`
            : 'Unknown',
         action: `Submitted "${c.basicInfo.title}"`,
         time: c.createdAt,
      })),
      ...recentUsers.map((u) => ({
         id: u._id,
         type: 'registration',
         user: `${u.firstname} ${u.lastname}`,
         action: `New ${u.role} registration`,
         time: u.createdAt,
      })),
      ...recentApps.map((a) => ({
         id: a._id,
         type: 'application',
         user: `${a.firstname} ${a.lastname}`,
         action: 'Applied to be instructor',
         time: a.createdAt,
      })),
   ];

   // Sort by time desc and take top 10
   const recentActivities = activities
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 10)
      .map((a) => ({
         ...a,
         time: new Date(a.time).toLocaleString(), // Format time as string
      }));

   res.status(200).json({
      status: 'success',
      data: {
         stats: {
            pendingRequests,
            totalInstructors,
            totalStudents,
            activeCourses,
         },
         growthChart,
         recentBookings,
         recentActivities,
      },
   });
});

export const getAllCourses = catchAsync(async (req, res, next) => {
   const { search, status } = req.query;
   const query = {};

   if (search) {
      query['basicInfo.title'] = { $regex: search, $options: 'i' };
   }

   if (status && status !== 'all') {
      query.status = status;
   }

   const courses = await courseModel
      .find(query)
      .populate('instructor', 'firstname lastname email avatar')
      .sort({ createdAt: -1 });

   res.status(200).json({
      status: 'success',
      results: courses.length,
      data: courses,
   });
});

// change the status to approved / rejected based on the req
// if approved create a new user with temp password and send email

export const updateApplicationStatus = catchAsync(async (req, res, next) => {
   const { status } = req.body;
   const { id } = req.params;

   const application = await applicationModel.findById(id);
   if (!application) {
      return next(new AppError("application doesn't Exists", 404));
   }

   const existingUser = await userModel.findOne({
      email: application.email,
   });

   if (existingUser) {
      // checking if the user already has an account in the users collection
      return next(
         new AppError(
            'Cannot approve or reject this request because this email already has an account',
            400
         )
      );
   }
   if (status === 'approved') {
      const existingUser = await userModel.findOne({
         email: application.email,
      });

      if (existingUser) {
         return next(
            new AppError(
               'Cannot approve this request because this email already has an account',
               400
            )
         );
      }

      // Generate temp password
      const generatedPassword = crypto.randomBytes(12).toString('hex');

      const newInstructorData = {
         firstname: application.firstname,
         lastname: application.lastname,
         email: application.email,
         password: generatedPassword,
         confirmPassword: generatedPassword,
         role: 'instructor',
         phone: application.phone,
      };

      const newInstructor = await userModel.create(newInstructorData);

      const emailDetails = {
         email: application.email,
         subject: 'E-Tutor Email Activation',
         text: `Congratulations! You are now an Instructor at E-Tutor.

Login using:
Email: ${application.email}
Password: ${generatedPassword}

Please change your password after login.
         `,
      };

      await sendEmail(emailDetails);
   } else if (status === 'rejected') {
      const emailDetails = {
         email: application.email,
         subject: 'E-Tutor Application Update',
         text: `Hello ${application.firstname} ${application.lastname},

We regret to inform you that your application to become an instructor at E-Tutor has been rejected.

Regards,
E-Tutor Team`,
      };
      await sendEmail(emailDetails);
      console.log('Rejection email sent to:', application.email);
   }

   // Update status
   application.status = status;
   await application.save();

   await applicationModel.findByIdAndDelete(id);

   console.log(`Application ${id} status updated to ${status}`);
   res.status(200).json({
      status: 'success',
      message: `Application status updated to ${status}`,
      application,
   });
});

// allow admin to publish / reject new courses
export const updateCourseStatus = catchAsync(async (req, res, next) => {
   const { courseId } = req.params;
   const { status } = req.body;

   if (!['published', 'rejected'].includes(status)) {
      return next(
         new AppError(
            'Invalid status. aAcepted values are "published" or "rejected".',
            400
         )
      );
   }

   const course = await courseModel.findById(courseId).populate('instructor');

   if (!course) {
      return next(new AppError('Course not found', 404));
   }

   course.status = status;
   if (status === 'published') {
      course.lastPublishedAt = Date.now();

      const emailDetails = {
         // send email to instructor about publication
         email: course.instructor.email,
         subject: 'E-Tutor Course Publication',
         text: `Congratulations! Your course "${course.basicInfo.title}" has been published.`,
      };

      await sendEmail(emailDetails);
   }

   await course.save();

   res.status(200).json({
      status: 'success',
      message: `Course has been ${status}.`,
      data: course,
   });
});

// get all courses in review status
export const getInReviewCourses = catchAsync(async (req, res) => {
   const courses = await courseModel
      .find({ status: 'review' })
      .populate('instructor', 'firstname lastname email');
   res.status(200).json({
      status: 'success',
      results: courses.length,
      data: courses,
   });
});

// search instructors by name and populate their courses
export const searchInstructors = catchAsync(async (req, res, next) => {
   // for admin to search instructors by name and populate there courses
   const { firstname, lastname } = req.query;

   const query = {
      role: 'instructor',
   };

   if (firstname) {
      query.firstname = { $regex: firstname, $options: 'i' };
   }
   if (lastname) {
      query.lastname = { $regex: lastname, $options: 'i' };
   }

   const instructors = await userModel.find(query).populate('courses');

   res.status(200).json({
      status: 'success',
      results: instructors.length,
      data: instructors,
   });
});

export const getAllStudents = catchAsync(async (req, res, next) => {
   const { search } = req.query;
   const query = { role: 'student' };

   if (search) {
      query.$or = [
         { firstname: { $regex: search, $options: 'i' } },
         { lastname: { $regex: search, $options: 'i' } },
         { email: { $regex: search, $options: 'i' } },
      ];
   }

   // Make sure to populate avatar or fields as needed if they are references, but usually avatar is string url
   const students = await userModel.find(query).sort({ createdAt: -1 });

   res.status(200).json({
      status: 'success',
      results: students.length,
      data: students,
   });
});

export const getStudent = catchAsync(async (req, res, next) => {
   const student = await userModel.findById(req.params.id);

   if (!student || student.role !== 'student') {
      return next(new AppError('No student found with that ID', 404));
   }

   // Fetch enrolled courses
   const enrollments = await enrollmentModel
      .find({ student: student._id })
      .populate({
         path: 'course',
         select:
            'basicInfo.title basicInfo.price advancedInfo.thumbnail advancedInfo.thumbnailUrl instructor',
         populate: { path: 'instructor', select: 'firstname lastname' },
      });

   // Extract courses from enrollments
   const courses = enrollments
      .map((enrollment) => {
         // Check if course exists (might be deleted)
         if (!enrollment.course) return null;
         return {
            ...enrollment.course.toObject(),
            enrolledAt: enrollment.createdAt,
            progress: enrollment.progress,
         };
      })
      .filter((c) => c !== null);

   res.status(200).json({
      status: 'success',
      data: {
         ...student.toObject(),
         courses: courses,
      },
   });
});

export const deleteStudent = catchAsync(async (req, res, next) => {
   const student = await userModel.findByIdAndDelete(req.params.id);

   if (!student) {
      return next(new AppError('No student found with that ID', 404));
   }

   res.status(204).json({
      status: 'success',
      data: null,
   });
});

export const getInstructor = catchAsync(async (req, res, next) => {
   const instructor = await userModel.findById(req.params.id);

   if (!instructor || instructor.role !== 'instructor') {
      return next(new AppError('No instructor found with that ID', 404));
   }

   const courses = await courseModel.find({ instructor: instructor._id });

   // Get rating stats for instructor's courses
   const ratingStats = await getInstructorRatingStats(instructor._id);

   // Calculate total students enrolled in instructor's courses
   const courseIds = courses.map((c) => c._id);
   const totalStudentsAgg = await enrollmentModel.aggregate([
      { $match: { course: { $in: courseIds }, isDeleted: false } },
      { $group: { _id: '$student' } },
      { $count: 'total' },
   ]);
   const totalStudents = totalStudentsAgg[0]?.total || 0;

   res.status(200).json({
      status: 'success',
      data: {
         ...instructor.toObject(),
         courses,
         averageRating: ratingStats.averageRating,
         totalRatings: ratingStats.totalRatings,
         totalStudents,
      },
   });
});
