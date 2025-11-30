import express from 'express';

import {
   createCourseDraft,
   deleteCourse,
   getCourseById,
   getInstructorCourses,
   getInstructorDraftCourses,
   submitCourseForReview,
   updateCourseAdvancedInfo,
   updateCourseBasicInfo,
   updateCourseCurriculum,
} from '../controller/courseControllers.js';
// import { protect } from '../middleware/authMiddleware.js';
import restrictTo from '../middleware/authorization.js';
import auth from '../middleware/authentication.js';

const router = express.Router();

// Apply authentication and authorization middleware
router.use(auth);
router.use(restrictTo('instructor', 'admin'));

router.route('/').post(createCourseDraft).get(getInstructorCourses);

router.route('/drafts').get(getInstructorDraftCourses);

router.route('/:courseId').get(getCourseById).delete(deleteCourse);

router.patch('/:courseId/basic', updateCourseBasicInfo);
router.patch('/:courseId/advanced', updateCourseAdvancedInfo);
router.patch('/:courseId/curriculum', updateCourseCurriculum);
router.patch('/:courseId/status', submitCourseForReview);

export default router;
