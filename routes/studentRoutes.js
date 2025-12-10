import express from 'express';
// authentication
import auth from '../middleware/authentication.js';
import restrictTo from '../middleware/authorization.js';
// controllers
import {
   enrollStudent,
   unenrollStudent,
   getStudentCourses,
   getStudentStats,
   getWishlist,
   addToWishlist,
   removeFromWishlist,
   updateProgress,
   getEnrollment,
} from '../controller/studentControllers.js';

const router = express.Router();

// restict access to Students Only
router.use(auth);
router.use(restrictTo('student'));

// add a Student to a course
// Student Dashboard Stats
router.get('/stats', getStudentStats);

// Enrollment & Progress
router.post('/enroll/', enrollStudent);
router.patch('/unenroll/:id', unenrollStudent);
router.get('/my-courses', getStudentCourses);
router.get('/enrollment/:courseId', getEnrollment);
router.patch('/progress', updateProgress);

// Wishlist
router.get('/wishlist', getWishlist);
router.post('/wishlist', addToWishlist);
router.delete('/wishlist/:id', removeFromWishlist);

export default router;
