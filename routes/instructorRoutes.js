import express from 'express';
import { requestApplication } from '../controller/instructorControllers.js';

const router = express.Router();

// authentication routes
router.post('/applicationRequest', requestApplication);

export default router;
