import express from 'express';
import auth from '../middleware/authentication.js';
import restrictTo from '../middleware/authorization.js';

const router = express.Router();
// ristricted access to Instructors / Admins
router.use(auth);

// router.route('/').post(restrictTo('instructor,admin'), bookHall);

export default router;
