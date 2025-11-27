import userModel from '../models/usersModel.js';
// import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';

export const getAllUsers = catchAsync(async (req, res, next) => {
   const users = await userModel.find({});
   res.status(200).json({
      status: 'succuss',
      users,
   });
});
