import express from 'express';
import {
   getApplicationRequests,
   updateApplicationStatus,
   updateCourseStatus,
   getInReviewCourses,
   searchInstructors,
   getDashboardStats,
   getAllCourses,
   getAllStudents,
   getInstructor,
   deleteStudent,
   getStudent,
} from '../controller/adminControllers.js';
import {
   getHalls,
   newHall,
   getHallDetails,
   updateHallDetails,
   deleteHall,
} from '../controller/hallControllers.js';
import auth from '../middleware/authentication.js';
import restrictTo from '../middleware/authorization.js';

const router = express.Router();

router.use(auth);
router.use(restrictTo('admin'));

// authentication routes
// Application Requests Routes for instructor applications
router.get('/dashboard/applicationRequest', getApplicationRequests);
router.get('/dashboard/overview', getDashboardStats);
// update application status route
router
   .route('/dashboard/applicationRequest/:id')
   .patch(updateApplicationStatus);

router.patch('/courses/:courseId/status', updateCourseStatus);
router.get('/courses/review', getInReviewCourses);
router.get('/courses', getAllCourses);
router.get('/students', getAllStudents);
router.get('/students/:id', getStudent);
router.delete('/students/:id', deleteStudent);
router.get('/instructors', searchInstructors);
router.get('/instructors/:id', getInstructor);

// Hall Management Routes
router.route('/halls').get(getHalls).post(newHall);

router
   .route('/halls/:id')
   .get(getHallDetails)
   .patch(updateHallDetails)
   .delete(deleteHall); // Soft Delete

export default router;
