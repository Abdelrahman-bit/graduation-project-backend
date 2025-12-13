import express from 'express';

// controllers
import {
   createAccessKey,
   getCourseAccessKey,
   getMyAccessKeys,
} from '../controller/accessCodeControllers.js';
// middleware
import auth from '../middleware/authentication.js';
import restrictTo from '../middleware/authorization.js';

const router = express.Router();

router.use(auth);
// authentication routes

router.post('/generate/:courseId', restrictTo('instructor'), createAccessKey);

router.get('/my', restrictTo('instructor'), getMyAccessKeys);
router.get('/my/:courseId', restrictTo('instructor'), getCourseAccessKey);

// router.post('/redeemCode', Redeem);

export default router;
