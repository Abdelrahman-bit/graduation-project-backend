import express from 'express';

// helpers
import auth from '../middleware/authentication.js';
import restrictTo from '../middleware/authorization.js';

//controllers
import { redeemAccessKey } from '../controller/redeemKeyControllers.js';

const router = express.Router();

router.use(auth);
router.use(restrictTo('student'));

// Redeem an Access Key
router.post('/accessKey', redeemAccessKey);

export default router;
