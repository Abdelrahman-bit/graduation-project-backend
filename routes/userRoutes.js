import express from 'express';
import auth from '../middleware/authentication.js';
import restrictTo from '../middleware/authorization.js';
import { getAllUsers } from '../controller/usersControllers.js';

const router = express.Router();

// authentication routes
router.get('/', auth, restrictTo('admin'), getAllUsers);

export default router;
