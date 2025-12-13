/**
 * Migration Script: Initialize Chat Groups for Existing Courses
 *
 * This script creates chat groups for all existing courses and adds
 * enrolled students to those groups.
 *
 * Run with: node scripts/migrateChatGroups.js
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Course from '../models/courseModel.js';
import Enrollment from '../models/enrollmentModel.js';
import ChatGroup from '../models/chatGroupModel.js';

dotenv.config({ path: './config.env' });

const connectionString = process.env.MONGODB_URL.replace(
   '<USERNAME>',
   process.env.DB_USERNAME
).replace('<PASSWORD>', process.env.DB_PASSWORD);

async function migrateChatGroups() {
   try {
      console.log('🔄 Connecting to database...');
      await mongoose.connect(connectionString);
      console.log('✅ Connected to MongoDB');

      // Get all courses
      const courses = await Course.find({}).select('_id instructor');
      console.log(`📚 Found ${courses.length} courses to process`);

      let created = 0;
      let skipped = 0;
      let errors = 0;

      for (const course of courses) {
         try {
            // Check if chat group already exists
            const existingGroup = await ChatGroup.findOne({
               course: course._id,
            });

            if (existingGroup) {
               console.log(
                  `⏭️  Chat group already exists for course ${course._id}`
               );
               skipped++;
               continue;
            }

            // Get all active enrollments for this course
            const enrollments = await Enrollment.find({
               course: course._id,
               isDeleted: false,
            }).select('student');

            const studentIds = enrollments.map((e) => e.student);

            // Create chat group with instructor as admin and all enrolled students
            const members = [course.instructor, ...studentIds];

            await ChatGroup.create({
               course: course._id,
               admin: course.instructor,
               members: [...new Set(members.map((id) => id.toString()))].map(
                  (id) => new mongoose.Types.ObjectId(id)
               ),
            });

            console.log(
               `✅ Created chat group for course ${course._id} with ${members.length} members`
            );
            created++;
         } catch (err) {
            console.error(
               `❌ Error processing course ${course._id}:`,
               err.message
            );
            errors++;
         }
      }

      console.log('\n📊 Migration Summary:');
      console.log(`   Created: ${created}`);
      console.log(`   Skipped (already exists): ${skipped}`);
      console.log(`   Errors: ${errors}`);
      console.log('\n✅ Migration complete!');
   } catch (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
   } finally {
      await mongoose.disconnect();
      console.log('🔌 Disconnected from database');
   }
}

// Run migration
migrateChatGroups();
