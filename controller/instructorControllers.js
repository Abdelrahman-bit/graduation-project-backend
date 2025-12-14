import applicationModel from '../models/applicationModel.js';
import userModel from '../models/usersModel.js';
import courseModel from '../models/courseModel.js';
import enrollmentModel from '../models/enrollmentModel.js';
import ChatGroup from '../models/chatGroupModel.js';

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

// Get all enrolled students for an instructor's courses
export const getEnrolledStudents = catchAsync(async (req, res, next) => {
   const instructorId = req.user._id;
   const { courseId } = req.query; // Optional: filter by course

   // Get instructor's courses
   let courseQuery = { instructor: instructorId };
   if (courseId) {
      courseQuery._id = courseId;
   }

   const courses = await courseModel
      .find(courseQuery)
      .select('_id basicInfo.title advancedInfo.thumbnail');

   const courseIds = courses.map((c) => c._id);

   // Get enrollments for these courses
   const enrollments = await enrollmentModel
      .find({
         course: { $in: courseIds },
         isDeleted: false,
      })
      .populate('student', 'firstname lastname email avatar')
      .populate('course', 'basicInfo.title advancedInfo.thumbnail')
      .sort({ createdAt: -1 });

   res.status(200).json({
      status: 'success',
      results: enrollments.length,
      data: enrollments,
   });
});

// Remove a student from a course (instructor only)
export const removeStudentFromCourse = catchAsync(async (req, res, next) => {
   const instructorId = req.user._id;
   const { courseId, studentId } = req.params;

   // 1) Verify the course belongs to this instructor
   const course = await courseModel.findOne({
      _id: courseId,
      instructor: instructorId,
   });

   if (!course) {
      return next(
         new AppError('Course not found or you do not own this course', 404)
      );
   }

   // 2) Find the enrollment
   const enrollment = await enrollmentModel.findOne({
      course: courseId,
      student: studentId,
      isDeleted: false,
   });

   if (!enrollment) {
      return next(new AppError('Student is not enrolled in this course', 404));
   }

   // 3) Mark enrollment as deleted
   enrollment.isDeleted = true;
   enrollment.unenrolledAt = new Date();
   await enrollment.save();

   // 4) Remove student from chat group
   try {
      await ChatGroup.removeMember(courseId, studentId);
      console.log(
         `[RemoveStudent] Student ${studentId} removed from chat group for course ${courseId}`
      );
   } catch (chatError) {
      console.error(
         '[RemoveStudent] Failed to remove student from chat group:',
         chatError.message
      );
   }

   res.status(200).json({
      status: 'success',
      message: 'Student removed from course successfully',
   });
});

// Get student details (for viewing profile)
export const getStudentDetails = catchAsync(async (req, res, next) => {
   const instructorId = req.user._id;
   const { studentId } = req.params;

   // Get instructor's courses
   const instructorCourses = await courseModel
      .find({ instructor: instructorId })
      .select('_id');
   const courseIds = instructorCourses.map((c) => c._id);

   // Check if student is enrolled in any instructor's course
   const enrollment = await enrollmentModel.findOne({
      student: studentId,
      course: { $in: courseIds },
      isDeleted: false,
   });

   // Also check if student has a pending request for any instructor's course
   const enrollmentRequestModel = (
      await import('../models/enrollmentRequestModel.js')
   ).default;
   const pendingRequest = await enrollmentRequestModel.findOne({
      student: studentId,
      course: { $in: courseIds },
      status: 'pending',
   });

   // If student is neither enrolled nor has a pending request, deny access
   if (!enrollment && !pendingRequest) {
      return next(new AppError('Student not found in your courses', 404));
   }

   // Get student details
   const student = await userModel
      .findById(studentId)
      .select('firstname lastname email phone avatar title bio createdAt');

   if (!student) {
      return next(new AppError('Student not found', 404));
   }

   // Get student's enrollments in instructor's courses with progress
   const enrollments = await enrollmentModel
      .find({
         student: studentId,
         course: { $in: courseIds },
         isDeleted: false,
      })
      .populate('course', 'basicInfo advancedInfo.thumbnail');

   // Format courses with progress
   const courses = enrollments.map((enr) => ({
      _id: enr.course._id,
      basicInfo: enr.course.basicInfo,
      advancedInfo: enr.course.advancedInfo,
      progress: enr.progress || 0,
      enrolledAt: enr.createdAt,
   }));

   res.status(200).json({
      status: 'success',
      data: {
         ...student.toObject(),
         courses,
      },
   });
});
