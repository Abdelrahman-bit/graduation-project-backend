import jwt from 'jsonwebtoken';

// Helper Functions

// Token Generator function
export const signToken = (userID) => {
   return jwt.sign({ id: userID }, process.env.JWT_SECRET_KEY, {
      expiresIn: process.env.TOKEN_EXPIRE,
   });
};
