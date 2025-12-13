import express from 'express';
import auth from '../middleware/authentication.js';
import { createTokenRequest } from '../controller/ablyController.js';

const router = express.Router();

/**
 * Ably Routes
 *
 * GET /api/ably/token - Get an Ably token for real-time features
 *
 * The token is required for:
 * - Real-time chat messaging
 * - Typing indicators
 * - Presence (who's online)
 * - Notifications
 *
 * All routes require authentication because we need the user's
 * identity to set their clientId in the Ably token.
 */

// Token endpoint - requires authentication
// The frontend calls this to get a token before connecting to Ably
router.get('/token', auth, createTokenRequest);

export default router;
