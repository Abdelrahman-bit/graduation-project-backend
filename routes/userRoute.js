import e from 'express';
import asyncHandler from '../utils/catchAsync';

const router = e.Router();

// api/user/me
router.get('/me', asyncHandler(getUserProfile));

router.put('/me', asyncHandler(updateProfile));

router.put('/me/avatar', asyncHandler(updateProfilePicture));

router.get('/:id', asyncHandler(getUserById));

router.put('/:id', asyncHandler(updateUser));

router.delete('/:id', asyncHandler(deleteUser));

export default router;
