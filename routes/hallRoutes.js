import express from 'express';

import auth from '../middleware/authentication.js';
import restrictTo from '../middleware/authorization.js';
import {
   getHalls,
   getHallDetails,
   newHall,
   updateHallDetails,
   deleteHall,
   getHallStatus,
   deleteHallSlotsByDate,
} from '../controller/hallControllers.js';
import {
   createSlot,
   updateSlot,
   deleteSlot,
} from '../controller/slotController.js';

const router = express.Router();

// authentication routes
// ristricted access to Instructors / Admins
router.use(auth);

// Admin Routes to Get all Halls & add new One
router
   .route('/')
   .get(restrictTo('admin', 'instructor'), getHalls)
   .post(restrictTo('admin'), newHall);

router.get('/status', restrictTo('admin'), getHallStatus);

// Slot management
router.post('/:id/slots', restrictTo('admin'), createSlot);
router.delete('/:id/slots', restrictTo('admin'), deleteHallSlotsByDate); // Bulk delete
router.patch('/slots/:id', restrictTo('admin'), updateSlot);
router.delete('/slots/:id', restrictTo('admin'), deleteSlot);

// Admin Routes to Get certian Halls & update or Delete them
router
   .route('/:id')
   .get(restrictTo('admin', 'instructor'), getHallDetails)
   .patch(restrictTo('admin'), updateHallDetails)
   .delete(restrictTo('admin'), deleteHall);
// admin Hall Crud System

export default router;
