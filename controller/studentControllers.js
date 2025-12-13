import courseModel from '../models/courseModel.js';
import enrollmentModel from '../models/enrollmentModel.js';

import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';

export const enrollStudent = catchAsync(async (req, res, next) => {
   const student = req.user._id;
   const course = req.body.course;

   if (!course) {
      return next(new AppError('Course ID is required', 400));
   }

   const courseExist = await courseModel.findById(course);
   if (!courseExist || courseExist.status !== 'published') {
      return next(
         new AppError(" Course isn't Published yet or Under admin review ", 404)
      );
   }

   const existing = await enrollmentModel.findOne({ student, course });

   if (existing && existing.status === 'enrolled') {
      return next(new AppError('Student already enrolled', 400));
   }

   if (existing && existing.status === 'unenrolled') {
      existing.status = 'enrolled';
      existing.unenrolledAt = undefined;
      await existing.save();

      return res.status(200).json({
         status: 'Re-enrolled successfully',
      });
   }

   await enrollmentModel.create({ student, course });

   res.status(201).json({
      status: 'Enrolled successfully',
   });
});

export const unenrollStudent = catchAsync(async (req, res, next) => {
   const student = req.user._id;
   const course = req.params.courseId;

   if (!course) {
      return next(new AppError('Course ID is required', 400));
   }

   // 1) Find enrollment record
   const enrolledStudent = await enrollmentModel.findOne({
      student,
      course,
   });

   // 2) If not enrolled OR already unenrolled → throw error
   if (!enrolledStudent || enrolledStudent.status === 'unenrolled') {
      return next(new AppError('Student is not enrolled in this course', 404));
   }

   // 3) Mark as unenrolled
   enrolledStudent.status = 'unenrolled';
   enrolledStudent.unenrolledAt = new Date();
   await enrolledStudent.save();

   res.status(200).json({
      status: 'Unenrolled successfully',
   });
});

export const getStudentCourses = catchAsync(async (req, res, next) => {
   const student = req.user._id;

   const studentCourses = await enrollmentModel
      .find({ student, status: 'enrolled' })
      .populate('course');

   res.status(200).json({
      status: 'Success',
      results: studentCourses.length,
      studentCourses,
   });
});
