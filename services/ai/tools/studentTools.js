/**
 * Student Tools for AI Chatbot
 * Tools that allow the AI to query student-specific data.
 * Only available to student users.
 */

import { tool } from 'ai';
import { z } from 'zod';
import Enrollment from '../../../models/enrollmentModel.js';
import Course from '../../../models/courseModel.js';

/**
 * Get student's enrolled courses
 * @param {string} userId - The student's user ID (injected automatically)
 */
export const createGetMyEnrollments = (userId) =>
   tool({
      description:
         'Get the list of courses the student is enrolled in. Use this when a student asks what courses they are taking or enrolled in.',
      inputSchema: z.object({}),
      execute: async () => {
         try {
            const enrollments = await Enrollment.find({
               user: userId,
            }).populate(
               'course',
               'basicInfo.title basicInfo.subtitle slug status'
            );

            if (enrollments.length === 0) {
               return {
                  message: 'You are not enrolled in any courses yet.',
                  courses: [],
               };
            }

            const courses = enrollments.map((e) => ({
               title: e.course?.basicInfo?.title || 'Unknown',
               subtitle: e.course?.basicInfo?.subtitle || '',
               slug: e.course?.slug,
               enrolledAt: e.createdAt,
            }));

            return {
               totalEnrollments: courses.length,
               courses,
            };
         } catch (error) {
            console.error('[StudentTools] getMyEnrollments error:', error);
            return { error: 'Failed to fetch your enrollments.' };
         }
      },
   });

/**
 * Get student's enrollment count
 * @param {string} userId - The student's user ID (injected automatically)
 */
export const createGetEnrollmentCount = (userId) =>
   tool({
      description:
         'Get the count of courses the student is enrolled in. Use this when a student asks how many courses they are enrolled in.',
      inputSchema: z.object({}),
      execute: async () => {
         try {
            const count = await Enrollment.countDocuments({ user: userId });

            return {
               enrollmentCount: count,
               message:
                  count === 0
                     ? 'You are not enrolled in any courses yet.'
                     : `You are enrolled in ${count} course${count > 1 ? 's' : ''}.`,
            };
         } catch (error) {
            console.error('[StudentTools] getEnrollmentCount error:', error);
            return { error: 'Failed to count your enrollments.' };
         }
      },
   });

/**
 * Factory function to create student tools with userId bound
 * @param {string} userId - The student's user ID
 */
export const createStudentTools = (userId) => ({
   getMyEnrollments: createGetMyEnrollments(userId),
   getEnrollmentCount: createGetEnrollmentCount(userId),
});
