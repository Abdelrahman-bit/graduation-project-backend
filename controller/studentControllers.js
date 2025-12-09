import courseModel from '../models/courseModel.js';
import enrollmentModel from '../models/enrollmentModel.js';
import wishlistModel from '../models/wishlistModel.js';

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
   const course = req.params.id;

   console.log(student, course);

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
      .populate({
         path: 'course',
         populate: {
            path: 'instructor',
            select: 'firstname lastname avatar title',
         },
      });

   res.status(200).json({
      status: 'Success',
      results: studentCourses.length,
      studentCourses,
   });
});

// --- Wishlist Controllers ---
export const getWishlist = catchAsync(async (req, res, next) => {
   const userId = req.user._id;
   const wishlist = await wishlistModel.find({ user: userId }).populate({
      path: 'course',
      populate: { path: 'instructor', select: 'firstname lastname' },
   });

   res.status(200).json({
      status: 'success',
      results: wishlist.length,
      data: wishlist,
   });
});

export const addToWishlist = catchAsync(async (req, res, next) => {
   const userId = req.user._id;
   const { courseId } = req.body;

   const exists = await wishlistModel.findOne({
      user: userId,
      course: courseId,
   });
   if (exists) {
      return next(new AppError('Course already in wishlist', 400));
   }

   const newItem = await wishlistModel.create({
      user: userId,
      course: courseId,
   });

   res.status(201).json({
      status: 'success',
      data: newItem,
   });
});

export const removeFromWishlist = catchAsync(async (req, res, next) => {
   const userId = req.user._id;
   const { id } = req.params; // Wishlist Item ID or Course ID? Let's assume Course ID for easier frontend logic, or handle both.
   // Ideally, delete by course ID for this user is safer/easier from UI

   const deleted = await wishlistModel.findOneAndDelete({
      user: userId,
      course: id,
   });

   if (!deleted) {
      return next(new AppError('Item not found in wishlist', 404));
   }

   res.status(204).json({
      status: 'success',
      data: null,
   });
});

// --- Stats and Progress ---
export const getStudentStats = catchAsync(async (req, res, next) => {
   const studentId = req.user._id;

   const enrollments = await enrollmentModel
      .find({
         student: studentId,
         status: 'enrolled',
      })
      .populate('course');

   const enrolledCount = enrollments.length;
   const completedCount = enrollments.filter((e) => e.progress === 100).length;
   const activeCount = enrolledCount - completedCount;

   // Unique Instructors
   const instructorIds = new Set(
      enrollments.map((e) => e.course.instructor?.toString()).filter(Boolean)
   );

   res.status(200).json({
      status: 'success',
      data: {
         enrolledCourses: enrolledCount,
         activeCourses: activeCount,
         completedCourses: completedCount,
         courseInstructors: instructorIds.size,
      },
   });
});

export const updateProgress = catchAsync(async (req, res, next) => {
   const studentId = req.user._id;
   const { courseId, progress, lastAccessed } = req.body;

   const enrollment = await enrollmentModel.findOne({
      student: studentId,
      course: courseId,
   });
   if (!enrollment) return next(new AppError('Enrollment not found', 404));

   if (progress !== undefined) enrollment.progress = progress;
   if (lastAccessed) enrollment.lastAccessed = lastAccessed;

   await enrollment.save();

   res.status(200).json({
      status: 'success',
      data: enrollment,
   });
});
