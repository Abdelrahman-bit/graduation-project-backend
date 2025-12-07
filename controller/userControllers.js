import userModel from '../models/usersModel.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';
import { filterBodyObj } from '../utils/helpers.js';

export const getUserProfile = catchAsync(async (req, res, next) => {
   const { id } = req.user;
   //    1) get users data
   const user = await userModel.findById(id);
   if (!user) {
      return next(new AppError('no User Found', 404));
   }
   // 2) send user Data
   res.status(200).json({
      status: 'succuss',
      user,
   });
});

export const updateUserProfile = catchAsync(async (req, res, next) => {
   const { id } = req.user;

   // 1) get users data
   const user = await userModel.findById(id);
   if (!user) {
      return next(new AppError('no User Found', 404));
   }
   // 2) make sure user doesn't change Password in this route
   if (req.body.password || req.body.confirmPassword) {
      return next(
         new AppError("this route doesn't support changing Password ", 404)
      );
   }

   // 3) make sure To filter body so that user can't change Role

   const filteredBody = filterBodyObj(
      req.body,
      'role',
      'password',
      'confirmPassword'
   );
   const updatedUser = await userModel.findByIdAndUpdate(id, filteredBody, {
      runValidators: true,
      new: true,
   });

   // 4) return the User has been updated
   res.status(200).json({
      status: 'succuss',
      updatedUser,
   });
});

export const updateUserPassword = catchAsync(async (req, res, next) => {
   const { id } = req.user;
   const { currentPassword, newPassword, confirmPassword } = req.body;

   // 1) make sure User entered current/new Password & confirm Password
   if (!currentPassword || !newPassword || !confirmPassword) {
      return next(new AppError('Please provide all required fields', 400));
   }

   // 2) get user with password
   const user = await userModel.findById(id).select('+password');

   if (!user) {
      return next(new AppError('User not found', 404));
   }

   // 3) check if the current password is valid
   const isValid = await user.checkPassword(currentPassword, user.password);
   if (!isValid) {
      return next(new AppError('Current password is incorrect', 401));
   }

   // 4) make sure new password & confirm Password are same
   if (newPassword !== confirmPassword) {
      return next(
         new AppError('New password and confirm password do not match', 400)
      );
   }

   // 5) update the password
   user.password = newPassword;
   user.confirmPassword = confirmPassword;
   user.passwordChangedAt = Date.now();
   await user.save();

   // 6) return the User has been updated
   res.status(200).json({
      status: 'success',
      message: 'Password updated successfully',
   });
});

export const updateUserAvatar = catchAsync(async (req, res, next) => {
   const { id } = req.user;
   const { avatar } = req.body;

   // 1) Validate avatar URL is provided
   if (!avatar) {
      return next(new AppError('Avatar URL is required', 400));
   }

   // 2) Update user avatar using findByIdAndUpdate to avoid validation issues
   const updatedUser = await userModel.findByIdAndUpdate(
      id,
      { avatar },
      {
         new: true,
         runValidators: false, // Don't run validators to avoid confirmPassword requirement
      }
   );

   if (!updatedUser) {
      return next(new AppError('User not found', 404));
   }

   // 3) Return the updated user
   res.status(200).json({
      status: 'success',
      message: 'Profile Pic updated successfully',
      user: updatedUser,
   });
});
