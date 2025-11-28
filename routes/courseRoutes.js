import express from 'express';

import {
   createCourseDraft,
   getCourseById,
   getInstructorCourses,
   submitCourseForReview,
   updateCourseAdvancedInfo,
   updateCourseBasicInfo,
   updateCourseCurriculum,
} from '../controller/courseControllers.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect, restrictTo('teacher', 'admin'));

router.route('/').post(createCourseDraft).get(getInstructorCourses);

router.route('/:courseId').get(getCourseById);

router.patch('/:courseId/basic', updateCourseBasicInfo);
router.patch('/:courseId/advanced', updateCourseAdvancedInfo);
router.patch('/:courseId/curriculum', updateCourseCurriculum);
router.patch('/:courseId/status', submitCourseForReview);

export default router;
