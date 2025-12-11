class AppError extends Error {
   constructor(message, statusCode) {
      super(message); // take the message provided by Error class

      this.statusCode = statusCode; // status code 404 / 500
      this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

      //to distingush between operational/bugs
      this.isOperational = true;

      Error.captureStackTrace(this, this.constructor);
   }
}

export default AppError;
