import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';
import accessKeyModel from '../models/accessCodeModel.js';
import enrollmentModel from '../models/enrollmentModel.js';
import courseModel from '../models/courseModel.js';
import ChatGroup from '../models/chatGroupModel.js';

export const redeemAccessKey = catchAsync(async (req, res, next) => {
   const { accessKey } = req.body;
   const studentId = req.user._id;

   // Check if the access key exists & is valid
   if (!accessKey) {
      return next(new AppError('Access key is required', 400));
   }

   const validAccessKey = await accessKeyModel.findOne({ key: accessKey });
   if (!validAccessKey) {
      return next(new AppError('Invalid access key', 404));
   }

   const course = await courseModel.findById(validAccessKey.course);
   if (!course) {
      return next(new AppError('Course not found', 404));
   }

   if (validAccessKey.expiresAt < Date.now()) {
      return next(new AppError('Access key has expired', 400));
   }

   if (validAccessKey.usedCount >= validAccessKey.usesLimit) {
      return next(new AppError('Access key usage limit reached', 400));
   }

   // Check if already enrolled
   const existingEnrollment = await enrollmentModel.findOne({
      student: studentId,
      course: course._id,
      isDeleted: false,
   });

   if (existingEnrollment) {
      return next(new AppError('You are already enrolled in this course', 400));
   }

   // Create a new student enrollment
   await enrollmentModel.create({
      student: studentId,
      course: course._id,
      expiresAt: Date.now() + validAccessKey.durationDays * 24 * 60 * 60 * 1000,
      accessKeyUsed: validAccessKey._id,
   });

   // Add student to chat group
   try {
      await ChatGroup.addMember(course._id, studentId);
      console.log(
         `[RedeemKey] Student ${studentId} added to chat group for course ${course._id}`
      );
   } catch (chatError) {
      console.error(
         '[RedeemKey] Failed to add student to chat group:',
         chatError.message
      );
      // Don't fail the redemption if chat group fails
   }

   validAccessKey.usedCount += 1;
   await validAccessKey.save();

   res.status(200).json({
      status: 'success',
      message: `Access key ${accessKey} redeemed successfully.`,
   });
});
