import express from 'express';
import auth from '../middleware/authentication.js';
import {
   getUserProfile,
   updateUserProfile,
   updateUserPassword,
} from '../controller/userControllers.js';

const router = express.Router();

// user Should be Authenticated
router.use(auth);

router.route('/profile').get(getUserProfile).patch(updateUserProfile);
router.patch('/profile/updatePassword', updateUserPassword);

export default router;
