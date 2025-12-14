// helpers
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import sendEmail from '../utils/sendEmail.js';

// models
import enrollmentRequestModel from '../models/enrollmentRequestModel.js';
import enrollmentModel from '../models/enrollmentModel.js';
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

   // 2) Check if already enrolled
   const alreadyEnrolled = await enrollmentModel.findOne({
      student: userId,
      course: courseId,
      isDeleted: false,
   });
   if (alreadyEnrolled) {
      return next(new AppError('You are already enrolled in this course', 400));
   }

   // 3) Check if already requested and still pending
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
      .populate('student', 'firstname lastname email avatar')
      .populate('course', 'basicInfo advancedInfo.thumbnail');
   res.status(200).json({
      status: 'success',
      results: requests.length,
      data: requests,
   });
});

// Get student's own enrollment request status for a course
export const getMyEnrollmentRequestStatus = catchAsync(
   async (req, res, next) => {
      const studentId = req.user._id;
      const { courseId } = req.params;

      const request = await enrollmentRequestModel.findOne({
         student: studentId,
         course: courseId,
      });

      res.status(200).json({
         status: 'success',
         data: {
            hasRequest: !!request,
            requestStatus: request?.status || null,
         },
      });
   }
);

export const approveEnrollmentRequest = catchAsync(async (req, res, next) => {
   const { requestId } = req.params;
   const { durationDays = 30 } = req.body; // Configurable duration
   const instructorId = req.user.id;

   // Check if the request exists
   const request = await enrollmentRequestModel
      .findById(requestId)
      .populate('student', 'firstname lastname email');

   if (!request) {
      return next(new AppError('Enrollment Request not found', 404));
   }

   const email = request.student.email;

   // Check if the request is already approved / rejected
   if (request.status !== 'pending') {
      return next(new AppError(`Request is already ${request.status}`, 400));
   }

   // Check if the course exists
   const course = await courseModel.findById(request.course);

   if (!course) {
      return next(new AppError('Course not found', 404));
   }

   if (course.instructor.toString() !== instructorId.toString()) {
      return next(
         new AppError("You don't have permission to manage this course", 403)
      );
   }

   // Change the request status
   request.status = 'approved';
   await request.save();

   // Generate access code & send it with email to student
   let key;
   let exists = true;

   while (exists) {
      key = accessKeyModel.generateKeyCode(8);
      exists = await accessKeyModel.findOne({ key });
   }

   const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

   const newAccessKey = await accessKeyModel.create({
      key,
      course: course._id,
      createdBy: course.instructor,
      durationDays,
      expiresAt,
   });

   // Send email to student with access code
   const courseLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/all-courses/${course._id}`;
   const emailDetails = {
      email,
      subject: 'Eduraa Course Enrollment Approved! 🎉',
      html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <p>
        Hello <strong>${request.student.firstname} ${request.student.lastname}</strong>,
      </p>

      <p>
        Congratulations! 🎉<br />
        Your enrollment request for the course
        <strong>"${course.basicInfo.title}"</strong> has been approved.
      </p>

      <p>
        You can use the following access code to enroll in the course:
      </p>

      <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #666;">Access Code</p>
        <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #FF6636; letter-spacing: 2px;">${newAccessKey.key}</p>
        <p style="margin: 5px 0 0 0; font-size: 12px; color: #888;">Valid for ${durationDays} days</p>
      </div>

      <p>
        👉 <a href="${courseLink}" target="_blank" style="color: #FF6636;">
          Click here to access the course
        </a>
      </p>

      <br />

      <p>
        Regards,<br />
        <strong>Eduraa Team</strong>
      </p>
    </div>
  `,
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

   // Check if the request exists
   const request = await enrollmentRequestModel
      .findById(requestId)
      .populate('student', 'firstname lastname email');

   if (!request) {
      return next(new AppError('Enrollment Request not found', 404));
   }

   const email = request.student.email;

   // Check if the request is already approved / rejected
   if (request.status !== 'pending') {
      return next(new AppError(`Request is already ${request.status}`, 400));
   }

   // Check if the course exists
   const course = await courseModel.findById(request.course);

   if (!course) {
      return next(new AppError('Course not found', 404));
   }

   if (course.instructor.toString() !== instructorId.toString()) {
      return next(
         new AppError("You don't have permission to manage this course", 403)
      );
   }

   // Change the request status
   request.status = 'rejected';
   await request.save();

   // Send rejection email to student
   const emailDetails = {
      email,
      subject: 'Eduraa Course Enrollment Update',
      html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <p>
        Hello <strong>${request.student.firstname} ${request.student.lastname}</strong>,
      </p>

      <p>
        We regret to inform you that your enrollment request for the course
        <strong>"${course.basicInfo.title}"</strong> has been declined.
      </p>

      <p>
        If you have any questions, please feel free to reach out to us.
      </p>

      <p>
        We hope you have a great learning experience with us in the future!
      </p>

      <br />

      <p>
        Regards,<br />
        <strong>Eduraa Team</strong>
      </p>
    </div>
  `,
   };
   await sendEmail(emailDetails);

   res.status(200).json({
      status: 'success',
      message: 'Enrollment request rejected and student notified',
   });
});
