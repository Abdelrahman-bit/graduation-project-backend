import jwt from 'jsonwebtoken';

// Helper Functions

// Token Generator function
export const signToken = (userID, role) => {
   return jwt.sign({ id: userID, role }, process.env.JWT_SECRET_KEY, {
      expiresIn: process.env.TOKEN_EXPIRE,
   });
};

// Email Generator function
