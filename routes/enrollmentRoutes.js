import express, { request } from 'express';

// controllers
import {
   requestEnrollment,
   getEnrollmentRequests,
   getMyEnrollmentRequestStatus,
   approveEnrollmentRequest,
   rejectEnrollementRequest,
} from '../controller/enrollmentRequestContollers.js';

// middleware
import auth from '../middleware/authentication.js';
import restrictTo from '../middleware/authorization.js';

const router = express.Router();

router.use(auth);

// Student routes
router.post(
   '/requestEnroll/:courseId',
   restrictTo('student'),
   requestEnrollment
);
router.get(
   '/my-request/:courseId',
   restrictTo('student'),
   getMyEnrollmentRequestStatus
);

// Instructor routes
router.get('/requests', restrictTo('instructor'), getEnrollmentRequests);
router.patch(
   '/requests/:requestId/approve',
   restrictTo('instructor'),
   approveEnrollmentRequest
);
router.patch(
   '/requests/:requestId/reject',
   restrictTo('instructor'),
   rejectEnrollementRequest
);

export default router;
