import jwt from 'jsonwebtoken';
import userModel from '../models/usersModel';
import AppError from '../utils/appError';

// authentication middleware that decrypt & check for the user Token
const auth = async function (req, res, next) {
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
            400
         )
      );
   }

   // 2 decrypt the token & seach for the user id , if not found rise an error
   const { _id } = jwt.verify(
      token,
      process.env.secret_key_used_to_generate_json_web_token_not_to_share
   );
   const user = await userModel.findById(_id);
   if (!user) {
      return next(
         new AppError('Account that belongs to this token is Deleted', 400)
      );
   }
   // 3 attach the user data along the request req.user = userdata
   req.user = user;
   // 4 exit the middleware
   next();
};

export default auth;
