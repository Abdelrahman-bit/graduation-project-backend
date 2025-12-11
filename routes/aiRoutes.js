import express from 'express';
import { chatWithAI } from '../controller/aiController.js';
import { optionalAuth } from '../middleware/authentication.js';

const router = express.Router();

// POST /api/chat
// We need a middleware that allows unauthenticated access but populates req.user if token exists.
// If 'protect' strictly requires login, we need a new 'optionalProtect' middleware.
// For now, let's assume valid JWT = user, invalid/missing = guest.

// Logging Middleware
router.use((req, res, next) => {
   console.log(`[AI Routes] ${req.method} ${req.url}`);
   next();
});

import { rateLimit } from 'express-rate-limit';

const windowConfig = parseInt(process.env.CHAT_RATE_LIMIT_WINDOW) || 60;
const windowMs = windowConfig > 10000 ? windowConfig : windowConfig * 60 * 1000; // If > 10000, assume ms, else minutes

const chatLimiter = rateLimit({
   windowMs: windowMs,
   limit: parseInt(process.env.CHAT_RATE_LIMIT_MAX) || 50,
   message: 'Too many chat requests from this IP, please try again later.',
});

router.post('/', chatLimiter, optionalAuth, chatWithAI);

export default router;
