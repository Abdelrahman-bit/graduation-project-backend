import express from 'express';
import {
   requestApplication,
   getInstructorDashboardStats,
   getEnrolledStudents,
   removeStudentFromCourse,
   getStudentDetails,
} from '../controller/instructorControllers.js';
import auth from '../middleware/authentication.js';
import { createAccessKey } from '../controller/accessCodeControllers.js';
// middleware
import restrictTo from '../middleware/authorization.js';

const router = express.Router();

// Public routes
router.post('/applicationRequest', requestApplication);

// Protected routes
router.use(auth);
router.use(restrictTo('instructor'));

router.get('/stats', getInstructorDashboardStats);
router.get('/enrolled-students', getEnrolledStudents);
router.get('/students/:studentId', getStudentDetails);
router.delete(
   '/courses/:courseId/students/:studentId',
   removeStudentFromCourse
);

export default router;
