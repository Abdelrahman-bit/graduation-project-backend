import courseModel from '../models/courseModel.js';
import enrollmentModel from '../models/enrollmentModel.js';
import wishlistModel from '../models/wishlistModel.js';
import ChatGroup from '../models/chatGroupModel.js';

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

   if (existing && !existing.isDeleted) {
      return next(new AppError('Student already enrolled', 400));
   }

   if (existing && existing.isDeleted) {
      existing.isDeleted = false;
      existing.unenrolledAt = undefined;
      await existing.save();

      // Add student back to chat group
      try {
         await ChatGroup.addMember(course, student);
         console.log(
            `[Enrollment] Student ${student} re-added to chat group for course ${course}`
         );
      } catch (chatError) {
         console.error(
            '[Enrollment] Failed to add student to chat group:',
            chatError.message
         );
      }

      // Remove from wishlist if exists
      await wishlistModel.findOneAndDelete({ user: student, course });

      return res.status(200).json({
         status: 'Re-enrolled successfully',
      });
   }

   await enrollmentModel.create({ student, course });

   // Add student to chat group
   try {
      await ChatGroup.addMember(course, student);
      console.log(
         `[Enrollment] Student ${student} added to chat group for course ${course}`
      );
   } catch (chatError) {
      console.error(
         '[Enrollment] Failed to add student to chat group:',
         chatError.message
      );
   }

   // Remove from wishlist if exists
   await wishlistModel.findOneAndDelete({ user: student, course });

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
   if (!enrolledStudent || enrolledStudent.isDeleted) {
      return next(new AppError('Student is not enrolled in this course', 404));
   }

   // 3) Mark as unenrolled
   enrolledStudent.isDeleted = true;
   enrolledStudent.unenrolledAt = new Date();
   await enrolledStudent.save();

   // 4) Remove student from chat group
   try {
      await ChatGroup.removeMember(course, student);
      console.log(
         `[Unenrollment] Student ${student} removed from chat group for course ${course}`
      );
   } catch (chatError) {
      console.error(
         '[Unenrollment] Failed to remove student from chat group:',
         chatError.message
      );
   }

   res.status(200).json({
      status: 'Unenrolled successfully',
   });
});

export const getStudentCourses = catchAsync(async (req, res, next) => {
   const student = req.user._id;

   const studentCourses = await enrollmentModel
      .find({ student, isDeleted: false })
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
      populate: { path: 'instructor', select: 'firstname lastname avatar' },
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
         isDeleted: false,
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
   const { courseId, lectureId, completed, lastAccessed } = req.body;

   const enrollment = await enrollmentModel.findOne({
      student: studentId,
      course: courseId,
   });
   if (!enrollment) return next(new AppError('Enrollment not found', 404));

   // Update Last Accessed
   if (lastAccessed) {
      enrollment.lastAccessed = lastAccessed;
   }

   // Update Completed Lectures
   if (lectureId && completed !== undefined) {
      const isCompleted = enrollment.completedLectures.some(
         (l) => l.lectureId === lectureId
      );

      if (completed && !isCompleted) {
         // Mark as completed
         enrollment.completedLectures.push({ lectureId });
      } else if (!completed && isCompleted) {
         // Mark as incomplete
         enrollment.completedLectures = enrollment.completedLectures.filter(
            (l) => l.lectureId !== lectureId
         );
      }

      // Calculate Progress Percentage
      const course = await courseModel.findById(courseId);
      if (course && course.curriculum && course.curriculum.sections) {
         let totalLectures = 0;
         course.curriculum.sections.forEach((section) => {
            if (section.lectures) totalLectures += section.lectures.length;
         });

         console.log('📊 Progress Calculation Debug:', {
            totalLectures,
            completedCount: enrollment.completedLectures.length,
            courseId,
         });

         if (totalLectures > 0) {
            enrollment.progress = Math.round(
               (enrollment.completedLectures.length / totalLectures) * 100
            );
            console.log('✅ New Progress:', enrollment.progress);
         } else {
            enrollment.progress = 0;
         }
      } else {
         console.warn(
            '⚠️ Course curriculum not found for progress calculation',
            {
               courseId,
               hasCourse: !!course,
               hasCurriculum: !!course?.curriculum,
            }
         );
      }
   } else if (req.body.progress !== undefined) {
      // Direct progress update fallback (legacy or manual override)
      enrollment.progress = req.body.progress;
   }

   await enrollment.save();

   res.status(200).json({
      status: 'success',
      data: enrollment,
   });
});

export const getEnrollment = catchAsync(async (req, res, next) => {
   const studentId = req.user._id;
   const { courseId } = req.params;

   const enrollment = await enrollmentModel.findOne({
      student: studentId,
      course: courseId,
      isDeleted: false,
   });

   if (!enrollment) {
      return next(new AppError('Enrollment not found', 404));
   }

   res.status(200).json({
      status: 'success',
      data: enrollment,
   });
});
