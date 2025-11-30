import AppError from '../utils/appError.js';
// take an array of roles allowed to access this route
const restrictTo = (...rules) => {
   // check if the token role is included in the rules array if not rise error
   return (req, res, next) => {
      if (!req.user) {
         return next(
            new AppError('You are not authenticated. Please login first.', 401)
         );
      }
      if (!rules.includes(req.user.role)) {
         return next(
            new AppError("You're not Authorized to perform this Action", 403)
         );
      }
      // grants access if found & exit the middleware
      next();
   };
};

export default restrictTo;
