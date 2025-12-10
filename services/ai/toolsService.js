import mongoose from 'mongoose';
import { z } from 'zod';
import { tool } from '@langchain/core/tools';
import User from '../../models/usersModel.js';
import Course from '../../models/courseModel.js';
import Enrollment from '../../models/enrollmentModel.js';

// --- Admin Tools ---

export const getPlatformStats = tool(
   async () => {
      try {
         const totalUsers = await User.countDocuments();
         const totalCourses = await Course.countDocuments();
         const totalEnrollments = await Enrollment.countDocuments();
         const publishedCourses = await Course.countDocuments({
            status: 'published',
         });

         return JSON.stringify({
            totalUsers,
            totalCourses,
            totalEnrollments,
            publishedCourses,
         });
      } catch (error) {
         return 'Failed to fetch platform stats.';
      }
   },
   {
      name: 'getPlatformStats',
      description:
         'Get general statistics about the platform (users, courses, enrollments). Only for Admins.',
      schema: z.object({}),
   }
);

// --- Instructor Tools ---

export const getInstructorStats = tool(
   async ({ instructorId }) => {
      try {
         const courses = await Course.find({ instructor: instructorId });
         const courseIds = courses.map((c) => c._id);
         const totalEnrollments = await Enrollment.countDocuments({
            course: { $in: courseIds },
         });
         const pendingCourses = courses.filter(
            (c) => c.status === 'review'
         ).length;

         return JSON.stringify({
            totalCourses: courses.length,
            totalStudents: totalEnrollments,
            pendingCourses: pendingCourses,
         });
      } catch (error) {
         return 'Failed to fetch instructor stats.';
      }
   },
   {
      name: 'getInstructorStats',
      description:
         'Get statistics for a specific instructor (their courses, students).',
      schema: z.object({
         instructorId: z.string().describe('The ID of the instructor'),
      }),
   }
);

export const checkCourseStatus = tool(
   async ({ courseName, instructorId }) => {
      try {
         // Fuzzy search for course by name for this instructor
         const course = await Course.findOne({
            instructor: instructorId,
            'basicInfo.title': { $regex: courseName, $options: 'i' },
         });

         if (!course) return `Course '${courseName}' not found.`;

         return JSON.stringify({
            title: course.basicInfo.title,
            status: course.status,
            slug: course.slug,
         });
      } catch (error) {
         return 'Failed to check course status.';
      }
   },
   {
      name: 'checkCourseStatus',
      description: 'Check the approval status of a specific course by name.',
      schema: z.object({
         courseName: z.string(),
         instructorId: z.string(),
      }),
   }
);
