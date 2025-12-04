import express from 'express';
import {
   createSlot,
   updateSlot,
   deleteSlot,
} from '../controller/slotController.js';
import auth from '../middleware/authentication.js';
import restrictTo from '../middleware/authorization.js';

const router = express.Router();

// restict access to Students Only
router.use(auth);
router.use(restrictTo('admin'));

router.route('/:id').post(createSlot).patch(updateSlot).delete(deleteSlot);

export default router;
