import express from 'express';
import auth from '../middleware/authentication.js';
import restrictTo from '../middleware/authorization.js';
import {
   submitRating,
   getMyRating,
   getCourseRatings,
   getCourseRatingStats,
} from '../controller/ratingController.js';

const router = express.Router();

// PUBLIC ROUTE - Course rating stats (no auth required for display on course pages)
router.get('/:courseId/stats', getCourseRatingStats);

// All routes below require authentication
router.use(auth);

// Student routes
router.post('/:courseId', restrictTo('student'), submitRating);
router.get('/:courseId/my-rating', restrictTo('student'), getMyRating);

// Get all ratings for a course (instructor and admin only)
router.get('/:courseId', restrictTo('instructor', 'admin'), getCourseRatings);

export default router;
