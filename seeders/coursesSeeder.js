import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { faker } from '@faker-js/faker';
import courseModel from '../models/courseModel.js';
import userModel from '../models/usersModel.js';

dotenv.config({
   path: './config.env',
});
// Build Mongo connection string
const connectionString = process.env.MONGODB_URL.replace(
   '<USERNAME>',
   process.env.DB_USERNAME
).replace('<PASSWORD>', process.env.DB_PASSWORD);
// ✅ YOUR FIXED VIDEO SOURCES
const VIDEO_POOL = [
   'https://res.cloudinary.com/dzcjymfa3/video/upload/v1764513146/x3tuv4uazs7fklwrfxwo.mp4',
   'https://res.cloudinary.com/dzcjymfa3/video/upload/v1764513061/wu3oy0bywzmsfxqb4hlj.mp4',
   'https://res.cloudinary.com/dzcjymfa3/video/upload/v1764498821/hvi8zvpw6gizknaiien5.mp4',
   'https://res.cloudinary.com/dzcjymfa3/video/upload/v1764449957/mokffsxjigl5i76xu9ps.mp4',
];

// ✅ UNSPLASH IMAGE GENERATOR (NO API KEY)
const RANDOM_IMAGE = () =>
   `https://picsum.photos/800/600?random=${Math.floor(Math.random() * 10000)}`;

const seedCourses = async () => {
   try {
      await mongoose.connect(connectionString);
      console.log('✅ MongoDB Connected');

      // ✅ GET REAL INSTRUCTORS
      const instructors = await userModel.find({ role: 'instructor' });

      if (!instructors.length) {
         throw new Error('❌ No instructors found. Seed users first.');
      }

      // ✅ CLEAR OLD COURSES
      await courseModel.deleteMany();
      console.log('🗑 Old courses removed');

      const courses = [];

      for (let i = 0; i < 20; i++) {
         const sections = [];

         // ✅ 3 SECTIONS
         for (let s = 0; s < 3; s++) {
            const lectures = [];

            // ✅ 4 LECTURES PER SECTION
            for (let l = 0; l < 4; l++) {
               lectures.push({
                  clientId: faker.string.uuid(),
                  title: faker.lorem.words(3),
                  description: faker.lorem.paragraph(),
                  notes: faker.lorem.sentences(2),
                  order: l + 1,
                  video: {
                     url: VIDEO_POOL[
                        Math.floor(Math.random() * VIDEO_POOL.length)
                     ],
                     fileName: 'lecture.mp4',
                     fileType: 'video/mp4',
                     duration: faker.number.int({ min: 120, max: 900 }),
                  },
                  attachments: [
                     {
                        title: faker.lorem.words(2),
                        file: {
                           url: RANDOM_IMAGE(),
                           fileName: 'resource.jpg',
                           fileType: 'image/jpeg',
                        },
                     },
                  ],
                  captions: [
                     {
                        language: 'English',
                        file: {
                           url: RANDOM_IMAGE(),
                           fileName: 'caption.jpg',
                           fileType: 'image/jpeg',
                        },
                     },
                  ],
               });
            }

            sections.push({
               clientId: faker.string.uuid(),
               title: faker.lorem.words(3),
               order: s + 1,
               lectures,
            });
         }

         const title = faker.lorem.words(4);

         courses.push({
            instructor: faker.helpers.arrayElement(instructors)._id,
            status: faker.helpers.arrayElement([
               'draft',
               'review',
               'published',
            ]),
            basicInfo: {
               title,
               subtitle: faker.lorem.sentence(),
               category: faker.helpers.arrayElement([
                  'Web Development',
                  'Backend',
                  'Frontend',
                  'AI',
                  'Mobile Development',
               ]),
               subCategory: faker.lorem.word(),
               topic: faker.lorem.word(),
               primaryLanguage: 'English',
               subtitleLanguage: 'Arabic',
               level: faker.helpers.arrayElement([
                  'beginner',
                  'intermediate',
                  'advanced',
                  'all-levels',
               ]),
               durationValue: faker.number.int({ min: 5, max: 40 }),
               durationUnit: faker.helpers.arrayElement([
                  'Day',
                  'Week',
                  'Month',
                  'Hour',
               ]),
            },
            advancedInfo: {
               thumbnail: {
                  url: RANDOM_IMAGE(),
                  fileName: 'thumbnail.jpg',
                  fileType: 'image/jpeg',
               },
               trailer: {
                  url: VIDEO_POOL[
                     Math.floor(Math.random() * VIDEO_POOL.length)
                  ],
                  fileName: 'trailer.mp4',
                  fileType: 'video/mp4',
               },
               description: faker.lorem.paragraph(),
               whatYouWillLearn: Array.from({ length: 4 }, () =>
                  faker.lorem.sentence()
               ),
               targetAudience: Array.from({ length: 3 }, () =>
                  faker.lorem.sentence()
               ),
               requirements: Array.from({ length: 3 }, () =>
                  faker.lorem.sentence()
               ),
               thumbnailUrl: RANDOM_IMAGE(),
               trailerUrl:
                  VIDEO_POOL[Math.floor(Math.random() * VIDEO_POOL.length)],
            },
            curriculum: {
               sections,
            },
            price: {
               amount: faker.number.int({ min: 0, max: 300 }),
               currency: 'USD',
            },
            tags: faker.lorem.words(5).split(' '),
            version: 1,
            lastPublishedAt: new Date(),
         });
      }

      // ✅ IMPORTANT FIX: USE .save() TO TRIGGER SLUG MIDDLEWARE
      for (const course of courses) {
         const doc = new courseModel(course);
         await doc.save();
      }

      console.log('✅ 20 Courses Seeded With Real Videos & Unsplash Images!');
      process.exit();
   } catch (err) {
      console.error('❌ Course Seeding Error:', err);
      process.exit(1);
   }
};

seedCourses();
