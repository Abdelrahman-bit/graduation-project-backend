import applicationModel from '../models/applicationModel.js';
import userModel from '../models/usersModel.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';
import crypto from 'crypto';
import sendEmail from '../utils/sendEmail.js';

export const getApplicationRequests = catchAsync(async (req, res, next) => {
   const applications = await applicationModel.find({});

   res.status(200).json({
      status: 'succuss',
      applications,
   });
});

// change the status to approved / rejected based on the req
// if approved

export const updateApplicationStatus = catchAsync(async (req, res, next) => {
   const { status } = req.body;
   const { id } = req.params;

   const application = await applicationModel.findById(id);
   if (!application) {
      return next(new AppError("application doesn't Exists", 404));
   }

   if (status === 'approved') {
      const existingUser = await userModel.findOne({
         email: application.email,
      });

      if (existingUser) {
         return next(
            new AppError(
               'Cannot approve this request because this email already has an account',
               400
            )
         );
      }

      // Generate temp password
      const generatedPassword = crypto.randomBytes(12).toString('hex');

      const newInstructorData = {
         name: application.name,
         email: application.email,
         password: generatedPassword,
         confirmPassword: generatedPassword,
         role: 'instructor',
         phone: application.phone,
      };

      const newInstructor = await userModel.create(newInstructorData);

      const emailDetails = {
         email: application.email,
         subject: 'E-Tutor Email Activation',
         text: `Congratulations! You are now an Instructor at E-Tutor.

Login using:
Email: ${application.email}
Password: ${generatedPassword}

Please change your password after login.
         `,
      };

      await sendEmail(emailDetails);
   }

   // Update status
   application.status = status;
   await application.save();

   res.status(200).json({
      status: 'success',
      message: `Application status updated to ${status}`,
      application,
   });
});
