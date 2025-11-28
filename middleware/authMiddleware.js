import jwt from 'jsonwebtoken';

import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';
import userModel from '../models/usersModel.js';

export const protect = catchAsync(async (req, res, next) => {
   const authHeader = req.headers.authorization;

   if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('You are not logged in', 401));
   }

   const token = authHeader.split(' ')[1];
   const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

   const currentUser = await userModel.findById(decoded.userID);
   if (!currentUser) {
      return next(
         new AppError('User belonging to this token no longer exists', 401)
      );
   }

   req.user = currentUser;
   next();
});

export const restrictTo = (...roles) =>
   catchAsync(async (req, res, next) => {
      if (!roles.includes(req.user.role)) {
         return next(
            new AppError(
               'You do not have permission to perform this action',
               403
            )
         );
      }
      next();
   });
