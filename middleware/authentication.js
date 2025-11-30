import jwt from 'jsonwebtoken';
import userModel from '../models/usersModel.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';

// authentication middleware that decrypt & check for the user Token
const auth = catchAsync(async function (req, res, next) {
   let token;
   // 1 make sure the user Send the token in the headers if not rise an error (Bearer exampleToken)

   if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
   ) {
      token = req.headers.authorization.split(' ')[1];
   }
   if (!token) {
      return next(
         new AppError(
            'Not token provided ,please Login / Signup to obtain Token',
            401
         )
      );
   }

   // 2 decrypt the token & seach for the user id , if not found rise an error
   let decoded;
   try {
      decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
   } catch (err) {
      return next(
         new AppError('Invalid or expired token. Please login again.', 401)
      );
   }

   const user = await userModel.findById(decoded.id);
   if (!user) {
      return next(
         new AppError('Account that belongs to this token is Deleted', 400)
      );
   }
   // 3 attach the user data along the request req.user = userdata
   req.user = user;
   // 4 exit the middleware
   next();
});

export default auth;
