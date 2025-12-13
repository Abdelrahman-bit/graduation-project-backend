import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';
import accessKeyModel from '../models/accessCodeModel.js';
import enrollmentModel from '../models/enrollmentModel.js';
import courseModel from '../models/courseModel.js';

export const redeemAccessKey = catchAsync(async (req, res, next) => {
   const { accessKey } = req.params;
   // check if the access Key exists & is valid not expired or already used
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

   validAccessKey.usedCount += 1;
   await validAccessKey.save();

   res.status(200).json({
      status: 'success',
      message: `Access key ${accessKey} redeemed successfully.`,
   });
});
