import express from 'express';
import auth from '../middleware/authentication.js';
import restrictTo from '../middleware/authorization.js';

const router = express.Router();

// restict access to Students Only
router.use(auth);
router.use(restrictTo('student'));

// add a Student to a course
// router.post('/enroll/', enrollStudent);
// // remove a Student from a course
// router.patch('/unenroll/:id', unenrollStudent);

// router.get('/my-courses', getStudentCourses);

export default router;
