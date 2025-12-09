import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars BEFORE importing services that depend on them
dotenv.config({ path: path.resolve('config.env') });

const seedEmbeddings = async () => {
   try {
      // Dynamic imports to ensure env vars are loaded
      const { default: User } = await import('../models/usersModel.js'); // Register User model
      const { default: Course } = await import('../models/courseModel.js');
      const { processCourseForEmbedding } = await import(
         '../services/ai/embeddingService.js'
      );

      console.log('Connecting to MongoDB...');

      const connectionString = (process.env.MONGODB_URL || '')
         .replace('<USERNAME>', process.env.DB_USERNAME || '')
         .replace('<PASSWORD>', process.env.DB_PASSWORD || '');

      if (!connectionString) {
         throw new Error(
            'Could not construct DB connection string from env vars'
         );
      }

      await mongoose.connect(connectionString);
      console.log('Connected to DB.');

      console.log('Fetching published courses...');
      const courses = await Course.find({ status: 'published' }).populate(
         'instructor'
      );
      console.log(`Found ${courses.length} published courses.`);

      for (const course of courses) {
         console.log(`Processing course: ${course.basicInfo.title}`);
         try {
            await processCourseForEmbedding(course);
            console.log(`  - Embeddings generated.`);
         } catch (err) {
            console.error(
               `  - Failed to generate embeddings for ${course.basicInfo.title}:`,
               err.message
            );
         }
      }

      console.log('Done!');
      process.exit(0);
   } catch (error) {
      console.error('Error seeding embeddings:', error);
      process.exit(1);
   }
};

seedEmbeddings();
