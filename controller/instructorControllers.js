import applicationModel from '../models/applicationModel.js';
import userModel from '../models/usersModel.js';
import courseModel from '../models/courseModel.js';
import enrollmentModel from '../models/enrollmentModel.js';

import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';
import sendEmail from '../utils/sendEmail.js';

export const requestApplication = catchAsync(async (req, res, next) => {
   const { firstname, lastname, email, phone } = req.body;

   // 1) Email exists in Users → reject
   const existingUser = await userModel.findOne({ email });
   if (existingUser) {
      console.log(
         `Application with email ${email} already belongs to an existing user`
      );
      return next(
         new AppError('This email already belongs to an existing user', 400)
      );
   }

   // 2) Email already applied before → reject
   const existingApplication = await applicationModel.findOne({ email });
   if (existingApplication) {
      console.log(
         `Application with email ${email} already submitted an application before`
      );
      return next(
         new AppError('This email already submitted an application before', 400)
      );
   }

   const applicationData = {
      firstname,
      lastname,
      email,
      phone,
   };

   // 3) Store request in DB
   const application = await applicationModel.create(applicationData);

   // 4) Send confirm to the User
   const emailDetails = {
      email,
      subject: 'E-Tutor Application Recieved',
      text: `Hello ${firstname} ${lastname},

We have recieved your application to become an instructor at E-Tutor.
We will get back to you shortly after reviewing your application.

Regards,
E-Tutor Team`,
   };
   await sendEmail(emailDetails);

   res.status(201).json({
      status: 'succuss',
      message:
         'Application Recieved , Expect to recieve an Email once the application approved',
   });
});

export const getInstructorDashboardStats = catchAsync(
   async (req, res, next) => {
      const instructorId = req.user._id;

      // 1. Get all courses by instructor
      const courses = await courseModel
         .find({ instructor: instructorId })
         .select('_id status');
      const courseIds = courses.map((c) => c._id);

      // 2. Calculate Course Stats
      const totalCourses = courses.length;
      const activeCourses = courses.filter(
         (c) => c.status === 'published'
      ).length;
      const draftCourses = courses.filter((c) => c.status === 'draft').length;
      const reviewCourses = courses.filter((c) => c.status === 'review').length;

      // 3. Get Enrollments for these courses
      const enrollments = await enrollmentModel
         .find({
            course: { $in: courseIds },
         })
         .sort({ createdAt: -1 }); // Get latest enrollments

      // 4. Calculate Total Students (Unique Students)
      const uniqueStudents = new Set(
         enrollments.map((e) => e.student.toString())
      );
      const totalStudents = uniqueStudents.size;

      // 5. Prepare Chart Data (Last 7 days enrollments)
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const chartData = [];
      const today = new Date();

      for (let i = 6; i >= 0; i--) {
         const date = new Date(today);
         date.setDate(today.getDate() - i);
         const dayName = days[date.getDay()];

         const startOfDay = new Date(date.setHours(0, 0, 0, 0));
         const endOfDay = new Date(date.setHours(23, 59, 59, 999));

         const dayEnrollments = enrollments.filter(
            (e) => e.createdAt >= startOfDay && e.createdAt <= endOfDay
         ).length;

         chartData.push({
            name: dayName,
            value: dayEnrollments,
            students: dayEnrollments,
         });
      }

      // 6. Recent Activity
      // Combine recent enrollments and recent course approvals
      // For MVP, let's just use top 5 enrollments as activity
      // Ideally, we would populate student info here.
      await enrollmentModel.populate(enrollments, {
         path: 'student',
         select: 'firstname lastname',
      });
      await enrollmentModel.populate(enrollments, {
         path: 'course',
         select: 'basicInfo.title',
      });

      const recentActivity = enrollments.slice(0, 5).map((enrollment) => ({
         _id: enrollment._id,
         type: 'enrollment',
         title: 'New Student Enrolled',
         message: `${enrollment.student.firstname} ${enrollment.student.lastname} enrolled in ${enrollment.course.basicInfo.title}`,
         time: enrollment.createdAt,
      }));

      res.status(200).json({
         status: 'success',
         data: {
            totalCourses,
            activeCourses,
            draftCourses,
            reviewCourses,
            totalStudents,
            chartData,
            recentActivity,
         },
      });
   }
);
