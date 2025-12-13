import Ably from 'ably';

/**
 * Ably Token Controller
 *
 * This controller handles Ably token authentication.
 * Instead of exposing the Ably API key to the frontend,
 * we generate secure time-limited tokens on the backend.
 *
 * Flow:
 * 1. Frontend user is authenticated via JWT
 * 2. Frontend requests an Ably token from this endpoint
 * 3. Backend creates a token with the user's ID and permissions
 * 4. Frontend uses this token to connect to Ably
 */

// Initialize Ably REST client (used for token generation)
const getAblyClient = () => {
   const apiKey = process.env.ABLY_API_KEY;
   if (!apiKey) {
      throw new Error('ABLY_API_KEY environment variable is not set');
   }
   return new Ably.Rest(apiKey);
};

/**
 * Create an Ably token request for the authenticated user
 *
 * @route GET /api/ably/token
 * @access Private (requires authentication)
 */
export const createTokenRequest = async (req, res) => {
   try {
      const ably = getAblyClient();

      // Get user info from the authenticated request
      const userId = req.user._id.toString();
      const userName = `${req.user.firstname} ${req.user.lastname}`;
      const userRole = req.user.role;

      console.log(
         `[Ably] Creating token for user: ${userName} (${userId}), role: ${userRole}`
      );

      // Define what this user can do with Ably channels
      // Format: 'channel-name': ['capability1', 'capability2']
      const tokenParams = {
         // clientId MUST be set for presence to work
         clientId: userId,

         // Capabilities define what channels the user can access and what they can do
         capability: {
            // All course chat channels - user can subscribe, publish messages, and use presence
            'chat:*': ['subscribe', 'publish', 'presence'],

            // User's personal notification channel - receive-only
            [`notifications:${userId}`]: ['subscribe'],

            // Global notifications (e.g., system announcements)
            'notifications:global': ['subscribe'],
         },
      };

      // Create a signed token request
      // This is MORE secure than creating a token directly because:
      // - The token request is signed with our API secret
      // - It can only be used once
      // - It expires quickly if not used
      const tokenRequest = await ably.auth.createTokenRequest(tokenParams);

      console.log(`[Ably] Token request created successfully for ${userName}`);

      res.status(200).json({
         status: 'success',
         data: tokenRequest,
         // Include user data so frontend can use it
         userData: {
            id: userId,
            name: userName,
            role: userRole,
            avatar: req.user.avatar,
         },
      });
   } catch (error) {
      console.error('[Ably] Token request error:', error.message);
      res.status(500).json({
         status: 'error',
         message: 'Failed to create Ably token',
         error:
            process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
   }
};
