// helpers
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import sendEmail from '../utils/sendEmail.js';

// models
import enrollmentRequestModel from '../models/enrollmentRequestModel.js';
import courseModel from '../models/courseModel.js';
import accessKeyModel from '../models/accessCodeModel.js';

export const requestEnrollment = catchAsync(async (req, res, next) => {
   const { courseId } = req.params;
   const userId = req.user._id; // student id

   if (!courseId) {
      return next(new AppError('Course ID is required', 400));
   }

   // 1) Check course existence
   const course = await courseModel.findById(courseId);
   if (!course) {
      return next(new AppError('This course does not exist', 404));
   }

   //    // 3) Check if already enrolled (optional)
   //    const alreadyEnrolled = await enrollmentModel.findOne({
   //       student: userId,
   //       course: courseId,
   //       status: 'enrolled',
   //    });
   //    if (alreadyEnrolled) {
   //       return next(new AppError('You are already enrolled in this course', 400));
   //    }

   // 4) Check if already requested and still pending
   const existingRequest = await enrollmentRequestModel.findOne({
      student: userId,
      course: courseId,
      status: 'pending',
   });

   if (existingRequest) {
      return next(
         new AppError('You already sent a request for this course', 400)
      );
   }

   // 5) Create new request
   await enrollmentRequestModel.create({
      student: userId,
      course: courseId,
      instructor: course.instructor,
   });

   res.status(201).json({
      status: 'success',
      message:
         'Enrollment request submitted successfully , expect an email once approved',
   });
});

export const getEnrollmentRequests = catchAsync(async (req, res, next) => {
   const instructorId = req.user._id;
   const requests = await enrollmentRequestModel
      .find({ instructor: instructorId, status: 'pending' })
      .populate('student', 'name email')
      .populate('course', 'basicInfo');
   res.status(200).json({
      status: 'success',
      results: requests.length,
      data: requests,
   });
});

export const approveEnrollmentRequest = catchAsync(async (req, res, next) => {
   const { requestId } = req.params;
   const instructorId = req.user.id;
   //    check if the request exists
   const request = await enrollmentRequestModel
      .findById(requestId)
      .populate('student', 'name email');
   const email = request.student.email;
   if (!request) {
      return next(new AppError('Enrollement Request not found', 404));
   }
   // check if the request is already approved / rejected
   if (request.status !== 'pending') {
      return next(new AppError(`Request is already ${request.status} `, 400));
   }
   //    check if the course exits

   const course = await courseModel.findById(request.course);

   if (!course) {
      return next(new AppError('Course not found', 404));
   }

   if (course.instructor.toString() !== instructorId.toString()) {
      return next(
         new AppError("You don't have permission to manage this course", 403)
      );
   }

   //    change the request status
   request.status = 'approved';
   request.save();

   //generate access code & send it with email to student

   let key;
   let exists = true;

   while (exists) {
      key = accessKeyModel.generateKeyCode(8);
      exists = await accessKeyModel.findOne({ key });
   }

   const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

   const newAccessKey = await accessKeyModel.create({
      key,
      course: course._id,
      createdBy: course.instructor,
      durationDays: 30,
      expiresAt,
   });

   // send email to student with access code
   const emailDetails = {
      email,
      subject: 'Eduraa Course Enrollment Update',
      text: `Hello ${request.student.name},Contratulations! Your enrollment request for the course "${course.title}" has been approved.
You can use the following access code to enroll in the course:
Access Code: ${newAccessKey.key} , Course Link ${process.env.NODE_ENV === 'production' ? `${process.env.FRONTEND_URL}/all-courses/${course._id}` : 'http://localhost:3000'}/all-courses/${course._id}
   Regards,
   Eduraa Team`,
   };
   await sendEmail(emailDetails);

   res.status(201).json({
      status: 'success',
      message: 'Successfully sent Email with code ',
      code: newAccessKey.key,
   });
});

export const rejectEnrollementRequest = catchAsync(async (req, res, next) => {
   const { requestId } = req.params;
   const instructorId = req.user.id;
   //    check if the request exists
   const request = await enrollmentRequestModel
      .findById(requestId)
      .populate('student', 'name email');

   const email = request.student.email;
   if (!request) {
      return next(new AppError('Enrollement Request not found', 404));
   }
   // check if the request is already approved / rejected
   if (request.status !== 'pending') {
      return next(new AppError(`Request is already ${request.status} `, 400));
   }
   //    check if the course exits

   const course = await courseModel.findById(request.course);

   if (!course) {
      return next(new AppError('Course not found', 404));
   }

   if (course.instructor.toString() !== instructorId.toString()) {
      return next(
         new AppError("You don't have permission to manage this course", 403)
      );
   }

   //    change the request status
   request.status = 'rejected';
   request.save();

   // send email to student with access code
   const emailDetails = {
      email,
      subject: 'Eduraa Course Enrollment Update',
      text: `Hello ${request.student.name},Unfortunately! we regret to inform  Your enrollment request for the course "${course.title}" has been rejected.
      hope you have a great learning experience with us in the future.
   Regards,
   Eduraa Team`,
   };
   await sendEmail(emailDetails);

   res.status(200).json({
      status: 'success',
      message: 'Successfully sent Email with code ',
      code: newAccessKey.key,
   });
});
