import express from 'express';
import {
   getApplicationRequests,
   updateApplicationStatus,
} from '../controller/adminControllers.js';

const router = express.Router();

// authentication routes
// router.get('/dashboard', getApplicationRequests);
router.get('/dashboard/applicationRequest', getApplicationRequests);
router.post('/dashboard/applicationRequest/:id', updateApplicationStatus);

export default router;
