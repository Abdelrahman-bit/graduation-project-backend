import applicationModel from '../models/applicationModel.js';
import userModel from '../models/usersModel.js';

import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';

export const requestApplication = catchAsync(async (req, res, next) => {
   const { name, email, phone } = req.body;

   // 1) Email exists in Users → reject
   const existingUser = await userModel.findOne({ email });
   if (existingUser) {
      return next(
         new AppError('This email already belongs to an existing user', 400)
      );
   }

   // 2) Email already applied before → reject
   const existingApplication = await applicationModel.findOne({ email });
   if (existingApplication) {
      return next(
         new AppError('This email already submitted an application before', 400)
      );
   }

   const applicationData = {
      name,
      email,
      phone,
   };

   // 3) Store request in DB
   const application = await applicationModel.create(applicationData);

   // 4) Send confirm to the User
   res.status(201).json({
      status: 'succuss',
      message:
         'Application Recieved , Expect to recieve an Email once the application approved',
   });
});
