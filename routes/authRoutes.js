import express from 'express';
import { signup, login } from '../controller/authControllers.js';

const router = express.Router();

// authentication routes
router.post('/signup', signup);
router.post('/login', login);
// router.post('/forgotPassword', forgotPassword);
// router.patch('/resetPassword/:token', resetPassword);

export default router;
