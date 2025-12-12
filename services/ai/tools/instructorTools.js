/**
 * Instructor Tools for AI Chatbot
 * Tools that allow the AI to query instructor-specific data.
 * Only available to instructor users.
 */

import { tool } from 'ai';
import { z } from 'zod';
import Course from '../../../models/courseModel.js';
import Enrollment from '../../../models/enrollmentModel.js';

/**
 * Get instructor's own statistics
 * @param {string} userId - The instructor's user ID (injected automatically)
 */
export const createGetMyStats = (userId) =>
   tool({
      description:
         'Get your instructor statistics including your course count, total students enrolled, and pending courses. Use this when the instructor asks about their own stats.',
      inputSchema: z.object({}),
      execute: async () => {
         try {
            // Ensure userId is a string for Mongoose queries
            const userIdStr = userId?.toString ? userId.toString() : userId;
            console.log(
               '[InstructorTools] getMyStats ENTER with userId:',
               userIdStr
            );

            const courses = await Course.find({ instructor: userIdStr });
            console.log('[InstructorTools] Found courses:', courses.length);

            const courseIds = courses.map((c) => c._id);
            const totalEnrollments = await Enrollment.countDocuments({
               course: { $in: courseIds },
            });

            const publishedCourses = courses.filter(
               (c) => c.status === 'published'
            ).length;
            const draftCourses = courses.filter(
               (c) => c.status === 'draft'
            ).length;
            const pendingReview = courses.filter(
               (c) => c.status === 'review'
            ).length;

            const stats = {
               totalCourses: courses.length,
               publishedCourses,
               draftCourses,
               pendingReview,
               totalStudents: totalEnrollments,
            };

            console.log(
               '[InstructorTools] getMyStats EXIT with:',
               JSON.stringify(stats)
            );
            return stats;
         } catch (error) {
            console.error('[InstructorTools] getMyStats ERROR:', error);
            return {
               error: 'Failed to fetch your statistics. Please try again.',
            };
         }
      },
   });

/**
 * Check status of a specific course by name
 * @param {string} userId - The instructor's user ID (injected automatically)
 */
export const createCheckCourseStatus = (userId) =>
   tool({
      description:
         'Check the approval status of a specific course by its name. Use this when an instructor asks about a specific course status.',
      inputSchema: z.object({
         courseName: z
            .string()
            .describe('The name or partial name of the course to check'),
      }),
      execute: async ({ courseName }) => {
         try {
            const userIdStr = userId?.toString ? userId.toString() : userId;
            const course = await Course.findOne({
               instructor: userIdStr,
               'basicInfo.title': { $regex: courseName, $options: 'i' },
            });

            if (!course) {
               return {
                  error: `Course "${courseName}" not found in your courses.`,
               };
            }

            return {
               title: course.basicInfo.title,
               status: course.status,
               slug: course.slug,
               createdAt: course.createdAt,
               updatedAt: course.updatedAt,
            };
         } catch (error) {
            console.error('[InstructorTools] checkCourseStatus error:', error);
            return { error: 'Failed to check course status.' };
         }
      },
   });

/**
 * Factory function to create instructor tools with userId bound
 * @param {string} userId - The instructor's user ID
 */
export const createInstructorTools = (userId) => ({
   getMyStats: createGetMyStats(userId),
   checkCourseStatus: createCheckCourseStatus(userId),
});
