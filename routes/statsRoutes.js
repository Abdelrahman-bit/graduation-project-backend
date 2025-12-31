import express from 'express';
import { getPublicStats } from '../controller/statsController.js';

const router = express.Router();

// Public route - no authentication required
router.get('/public', getPublicStats);

export default router;
