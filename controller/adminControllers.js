import applicationModel from '../models/applicationModel.js';
import userModel from '../models/usersModel.js';
import courseModel from '../models/courseModel.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';
import crypto from 'crypto';
import sendEmail from '../utils/sendEmail.js';

export const getApplicationRequests = catchAsync(async (req, res, next) => {
   const applications = await applicationModel.find({ status: 'pending' });

   res.status(200).json({
      status: 'succuss',
      applications,
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
