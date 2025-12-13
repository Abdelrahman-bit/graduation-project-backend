import express from 'express';

// controllers
import { requestApplication } from '../controller/instructorControllers.js';
import { createAccessKey } from '../controller/accessCodeControllers.js';
// middleware
import auth from '../middleware/authentication.js';
import restrictTo from '../middleware/authorization.js';

const router = express.Router();

// authentication routes
router.post('/applicationRequest', requestApplication);

export default router;
