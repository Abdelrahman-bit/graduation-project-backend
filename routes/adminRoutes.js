import express from 'express';
import {
   getApplicationRequests,
   updateApplicationStatus,
   updateCourseStatus,
   getInReviewCourses,
   searchInstructors,
} from '../controller/adminControllers.js';
import auth from '../middleware/authentication.js';
import restrictTo from '../middleware/authorization.js';

const router = express.Router();

router.use(auth);
router.use(restrictTo('admin'));

// authentication routes
// Application Requests Routes for instructor applications
router.get('/dashboard/applicationRequest', getApplicationRequests);
// update application status route
router
   .route('/dashboard/applicationRequest/:id')
   .patch(updateApplicationStatus);

router.patch('/courses/:courseId/status', updateCourseStatus);
router.get('/courses/review', getInReviewCourses);
router.get('/instructors', searchInstructors);

export default router;
