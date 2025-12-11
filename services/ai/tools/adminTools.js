/**
 * Admin Tools for AI Chatbot
 * Tools that allow the AI to query platform-wide statistics.
 * Only available to admin users.
 */

import { tool } from 'ai';
import { z } from 'zod';
import User from '../../../models/usersModel.js';
import Course from '../../../models/courseModel.js';
import Enrollment from '../../../models/enrollmentModel.js';

/**
 * Get platform-wide statistics
 */
export const getPlatformStats = tool({
   description:
      'Get general statistics about the platform including total users, courses, and enrollments. Use this when an admin asks about platform metrics.',
   inputSchema: z.object({}),
   execute: async () => {
      try {
         const [
            totalUsers,
            totalCourses,
            totalEnrollments,
            publishedCourses,
            draftCourses,
            instructors,
            students,
         ] = await Promise.all([
            User.countDocuments(),
            Course.countDocuments(),
            Enrollment.countDocuments(),
            Course.countDocuments({ status: 'published' }),
            Course.countDocuments({ status: 'draft' }),
            User.countDocuments({ role: 'instructor' }),
            User.countDocuments({ role: 'student' }),
         ]);

         return {
            totalUsers,
            instructors,
            students,
            totalCourses,
            publishedCourses,
            draftCourses,
            totalEnrollments,
         };
      } catch (error) {
         console.error('[AdminTools] getPlatformStats error:', error);
         return { error: 'Failed to fetch platform statistics.' };
      }
   },
});

/**
 * Factory function to create admin tools
 * Makes it easy to add more tools in the future
 */
export const createAdminTools = () => ({
   getPlatformStats,
});
