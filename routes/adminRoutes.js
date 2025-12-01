import express from 'express';
import {
   getApplicationRequests,
   updateApplicationStatus,
   updateCourseStatus,
} from '../controller/adminControllers.js';
import { getInReviewCourses } from '../controller/courseControllers.js';
import auth from '../middleware/authentication.js';
import restrictTo from '../middleware/authorization.js';

const router = express.Router();

router.use(auth);
router.use(restrictTo('admin'));

// authentication routes
// router.get('/dashboard', getApplicationRequests);
router.get('/dashboard/applicationRequest', getApplicationRequests);
router.post('/dashboard/applicationRequest/:id', updateApplicationStatus);

router.patch('/courses/:courseId/status', updateCourseStatus);
router.get('/courses/review', getInReviewCourses);

export default router;
