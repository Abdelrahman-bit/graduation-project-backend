import userModel from '../models/usersModel.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';
import { signToken } from '../utils/helpers.js';

export const signup = catchAsync(async (req, res, next) => {
   // get user data (avoid data pollution)
   const userData = {
      name: `${req.body.firstName} ${req.body.lastName}`,
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
      confirmPassword: req.body.confirmPassword,
   };
   // create & save user to DB
   const newUser = await userModel.create(userData);

   // generate & send Token
   const token = signToken(newUser._id, newUser.role);
   newUser.password = undefined;
   res.status(201).json({
      status: 'succuss',
      token, // send the newly generated token to the user
   });
});

export const login = catchAsync(async (req, res, next) => {
   // get user cridentials
   const { email, password } = req.body;
   if (!email || !password) {
      return next(new AppError('Please Provide Both email & password', 400));
   }
   // 2 search for the user using email if not found rise error done
   const user = await userModel.findOne({ email }).select('+password');

   // 3 compare the password if not same rise error
   if (!user || !(await user.checkPassword(password, user.password))) {
      return next(new AppError('InCorrect credentials', 401));
   }
   // 4 generate a token and send back to user
   const token = signToken(user._id, user.role);
   user.password = undefined;
   res.status(200).json({
      status: 'succuss',
      token,
   });
});
