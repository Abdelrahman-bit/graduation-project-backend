import AppError from '../utils/appError.js';

const sendErrorDev = (err, res) => {
   res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      stack: err.stack,
      error: err,
   });
};

const sendErrorProd = (err, res) => {
   // sending error to the client if operational; error
   if (err.isOperational) {
      res.status(err.statusCode).json({
         status: err.status,
         message: err.message,
      });
      // not to leak any programming error info to the client
   } else {
      res.status(500).json({
         status: 'error',
         message: 'something went very bad ',
      });
   }
};

// Global Error Handler Middleware (spacifing 4 parameters express  will know that this MW for eror handling)
const globalErrorController = (err, req, res, next) => {
   err.statusCode = err.statusCode || 500; // => default error
   err.status = err.status || 'error'; // => default

   if (process.env.NODE_ENV === 'development') {
      sendErrorDev(err, res);
   } else if (process.env.NODE_ENV === 'production') {
      if (err.name === 'CastError') {
         err = new AppError(`Invalid ${err.path}: ${err.value}`, 400);
      }
      if (err.code === 11000) {
         err = new AppError('Duplicate field value entered', 400);
      }

      if (err.name === 'ValidationError') {
         const errors = Object.values(err.errors)
            .map((el) => el.message)
            .join('. ');
         err = new AppError(`Invalid input data. ${errors}`, 400);
      }

      if (err.name === 'JsonWebTokenError') {
         err = new AppError(`Invalid token , please login to gain access`, 401);
      }

      if (err.name === 'TokenExpiredError') {
         err = new AppError(`Expired token , please login to gain access`, 401);
      }
      return sendErrorProd(err, res);
   }
};

export default globalErrorController;
