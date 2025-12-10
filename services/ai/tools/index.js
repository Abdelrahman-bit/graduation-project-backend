/**
 * AI Tools Factory
 *
 * Central factory for creating role-appropriate tools for the AI chatbot.
 * To add new tools in the future:
 * 1. Create the tool in the appropriate *Tools.js file
 * 2. Export it from the factory function below
 * 3. Done!
 */

import { createAdminTools } from './adminTools.js';
import { createInstructorTools } from './instructorTools.js';
import { createStudentTools } from './studentTools.js';

/**
 * Get tools appropriate for the user's role
 * @param {string} role - User role: 'admin', 'instructor', 'student', or 'guest'
 * @param {string|null} userId - User ID (required for instructor/student tools)
 * @returns {object|undefined} Tools object or undefined for guests
 */
export const getToolsForRole = (role, userId) => {
   switch (role) {
      case 'admin':
         return createAdminTools();

      case 'instructor':
         if (!userId) {
            console.warn('[Tools] No userId provided for instructor tools');
            return undefined;
         }
         return createInstructorTools(userId);

      case 'student':
         if (!userId) {
            console.warn('[Tools] No userId provided for student tools');
            return undefined;
         }
         return createStudentTools(userId);

      case 'guest':
      default:
         // Guests don't get any tools
         return undefined;
   }
};

/**
 * Get a list of available tool names for a role (for debugging/logging)
 */
export const getToolNamesForRole = (role) => {
   switch (role) {
      case 'admin':
         return ['getPlatformStats'];
      case 'instructor':
         return ['getMyStats', 'checkCourseStatus'];
      case 'student':
         return ['getMyEnrollments', 'getEnrollmentCount'];
      default:
         return [];
   }
};
