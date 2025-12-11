import express from 'express';
import auth from '../middleware/authentication.js';
import {
   getUserProfile,
   getPublicUserProfile,
   updateUserProfile,
   updateUserPassword,
   updateUserAvatar,
} from '../controller/userControllers.js';

const router = express.Router();

// Protected Routes
router
   .route('/profile')
   .get(auth, getUserProfile)
   .patch(auth, updateUserProfile);

router.patch('/profile/updatePassword', auth, updateUserPassword);
router.patch('/profile/updateProfilePic', auth, updateUserAvatar);

// Public Routes (Place generic /:id at the end to avoid conflicts)
router.get('/:id', getPublicUserProfile);

export default router;
