import express from 'express';
import auth from '../middleware/authentication.js';
import restrictTo from '../middleware/authorization.js';
import {
   createBooking,
   getMyBookings,
   cancelBooking,
   // updateBookingStatus,
} from '../controller/bookingControllers.js';

const router = express.Router();
// ristricted access to Instructors /admins
router.use(auth);

// Create a new booking & Get all bookings (instructor)

router
   .route('/')
   .post(restrictTo('instructor'), createBooking)
   .get(restrictTo('instructor'), getMyBookings);

// Update booking status (admin) (take the booking Id in params & status in body)
// router.patch('/:id', restrictTo('admin'), updateBookingStatus);
router.delete('/:id', cancelBooking);

export default router;
