import express from 'express';
import {
   requestApplication,
   getInstructorDashboardStats,
} from '../controller/instructorControllers.js';
import auth from '../middleware/authentication.js';

const router = express.Router();

// Public routes
router.post('/applicationRequest', requestApplication);

// Protected routes
router.use(auth);
router.get('/stats', getInstructorDashboardStats);

export default router;
