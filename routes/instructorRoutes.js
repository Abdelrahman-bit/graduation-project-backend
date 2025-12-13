import express from 'express';
import {
   requestApplication,
   getInstructorDashboardStats,
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
router.get('/stats', getInstructorDashboardStats);

export default router;
