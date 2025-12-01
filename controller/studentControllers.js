import courseModel from '../models/courseModel.js';
import enrollmentModel from '../models/enrollmentModel.js';

import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';

const enrollStudent = catchAsync(async (req, res, next) => {
   // 1) get the studentId from the req.user & courseId from the req.body
   const studentId = req.user._id;
   const { courseId } = req.body;
   if (!courseId) {
      return next(new AppError('Course ID is required', 400));
   }
   // 2) Check that course exists
   const course = await courseModel.findById(courseId);
   if (!course) {
      return next(new AppError("Course doesn't Exists", 404));
   }
   // 3) check that the student isn't already unrolled in the course
   const alreadyEnrolled = await enrollmentModel.findOne({
      studentId,
      courseId,
   });
   if (alreadyEnrolled) {
      return next(new AppError(' student is Already Enrolled ', 400));
   }
   // 3) enroll the student in the course & send back response to the student
   const enrollementData = {
      user: studentId,
      course: courseId,
   };
   const enroll = await enrollmentModel.create(enrollementData);
   res.status(201).json({
      status: 'Enrolled Succussfully',
   });
});
