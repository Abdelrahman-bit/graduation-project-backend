// models
import accessKeyModel from '../models/accessCodeModel.js';
import courseModel from '../models/courseModel.js';

// helpers
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';

export const createAccessKey = catchAsync(async (req, res, next) => {
   const { courseId } = req.params;
   const createdBy = req.user._id;
   const { durationDays = 30 } = req.body;

   const courseExists = await courseModel.findOne({
      _id: courseId,
      instructor: createdBy,
   });
   if (!courseExists) {
      return next(
         new AppError(
            'You are not authorized to generate Access Key for this course',
            401
         )
      );
   }

   // generate unique code
   let key;
   let exists = true;

   while (exists) {
      key = accessKeyModel.generateKeyCode(8);
      exists = await accessKeyModel.findOne({ key });
   }

   const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

   const newAccessKey = await accessKeyModel.create({
      key,
      course: courseId,
      createdBy,
      durationDays,
      expiresAt,
   });

   res.status(201).json({
      status: 'success',
      data: newAccessKey,
   });
});

// controller to get all access keys created by the logged-in instructor
export const getMyAccessKeys = catchAsync(async (req, res, next) => {
   const instructorId = req.user._id;

   const accessKeys = await accessKeyModel.find({ createdBy: instructorId });

   res.status(200).json({
      status: 'success',
      results: accessKeys.length,
      data: accessKeys,
   });
});

// controller to get all access keys created by the logged-in instructor for certain course

export const getCourseAccessKey = catchAsync(async (req, res, next) => {
   const course = req.params.courseId;
   const createdBy = req.user._id;

   const courseExists = await courseModel.findById({ course, createdBy });

   if (!courseExists) {
      return next(new AppError('No Course Found with Such ID', 404));
   }

   const accessKeys = await accessKeyModel.find({ course });

   if (accessKeys.length === 0) {
      return next(new AppError('No Access Keys Found for This Course', 404));
   }

   res.status(200).json({
      status: 'success',
      results: accessKeys.length,
      data: accessKeys,
   });
});
