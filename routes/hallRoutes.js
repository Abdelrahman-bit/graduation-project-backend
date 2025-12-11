import express from 'express';

import auth from '../middleware/authentication.js';
import restrictTo from '../middleware/authorization.js';
import {
   getHalls,
   getHallDetails,
   newHall,
   updateHallDetails,
   deleteHall,
} from '../controller/hallControllers.js';

const router = express.Router();

// authentication routes
// ristricted access to Instructors / Admins
router.use(auth);

// Admin Routes to Get all Halls & add new One
router
   .route('/')
   .get(restrictTo('admin', 'instructors'), getHalls)
   .post(restrictTo('admin'), newHall);

// Admin Routes to Get certian Halls & update or Delete them
router
   .route('/:id')
   .get(restrictTo('admin', 'instructors'), getHallDetails)
   .patch(restrictTo('admin'), updateHallDetails)
   .delete(restrictTo('admin'), deleteHall);
// admin Hall Crud System

export default router;
