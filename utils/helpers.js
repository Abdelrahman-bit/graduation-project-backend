import jwt from 'jsonwebtoken';

// Helper Functions

// Token Generator function
export const signToken = (userID, role) => {
   return jwt.sign({ id: userID, role }, process.env.JWT_SECRET_KEY, {
      expiresIn: process.env.TOKEN_EXPIRE,
   });
};

// Filter the Body from notAllowed Fields
export const filterBodyObj = (bodyObj, ...notAllowedFields) => {
   const filteredObj = {};

   Object.keys(bodyObj).forEach((key) => {
      if (!notAllowedFields.includes(key)) {
         filteredObj[key] = bodyObj[key];
      }
   });

   return filteredObj;
};

// Email Generator function
