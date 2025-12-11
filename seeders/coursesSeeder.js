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

// ✅ RANDOM IMAGE
const RANDOM_IMAGE = () =>
   `https://picsum.photos/800/600?random=${Math.floor(Math.random() * 10000)}`;

/* ---------------------------
  Curated content pools
   - Use meaningful titles/subtitles/outcomes
----------------------------*/
const COURSE_TITLES = [
   'Modern React with Hooks & Context',
   'Node.js REST APIs from Zero to Production',
   'Full-Stack MERN E-Commerce',
   'Practical PostgreSQL for Developers',
   'Intro to Machine Learning with Python',
   'TypeScript for JavaScript Developers',
   'Frontend Performance Optimization',
   'Three.js: 3D Web Experiences',
   'Testing JavaScript Apps (Jest + RTL)',
   'Secure Web Authentication (JWT & OAuth)',
];

const SUBTITLES = [
   'Build production-ready apps with best practices',
   'Design, implement and deploy scalable APIs',
   'From product model to checkout and payments',
   'Databases, queries and performance tuning',
   'Models, pipelines and real-world examples',
   'Add types to scale your JS codebase safely',
   'Reduce load time and boost UX metrics',
   'Create interactive 3D scenes for the web',
   'Unit, integration and E2E testing strategies',
   'Authentication flows and secure sessions',
];

const CATEGORIES = [
   'Web Development',
   'Backend',
   'Frontend',
   'AI',
   'Mobile Development',
   'Databases',
   'DevOps',
];

const TOPICS = [
   'React',
   'Node.js',
   'Express',
   'PostgreSQL',
   'TypeScript',
   'Three.js',
   'Testing',
   'Authentication',
   'Performance',
   'Machine Learning',
];

const LEVELS = ['beginner', 'intermediate', 'advanced', 'all-levels'];

const LEARNING_OUTCOMES = {
   React: [
      'Build reusable components and custom hooks',
      'Manage global state with Context API',
      'Optimize component rendering and performance',
      'Test React components with React Testing Library',
   ],
   'Node.js': [
      'Design RESTful endpoints with Express',
      'Handle authentication and authorization',
      'Write production error handling and logging',
      'Deploy Node apps and connect to databases',
   ],
   PostgreSQL: [
      'Design normalized schemas and relations',
      'Write advanced SQL queries and indexes',
      'Use transactions and manage migrations',
      'Tune queries for large datasets',
   ],
};

const TARGET_AUDIENCE_EXAMPLES = [
   'Junior developers who want to level up',
   'Frontend engineers needing deeper React skills',
   'Backend engineers who build REST APIs',
   'Students preparing for real-world projects',
];

const REQUIREMENTS_EXAMPLES = [
   'Basic JavaScript knowledge',
   'Familiarity with HTML and CSS',
   'Node.js (for backend courses)',
   'Git and a code editor (VSCode recommended)',
];

/* ---------------------------
  Helpers
----------------------------*/
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const uniqueTagsFrom = (title, category) => {
   const words = title
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .slice(0, 4);
   return Array.from(new Set([category.toLowerCase(), ...words]));
};

/* ---------------------------
  Seeder
----------------------------*/
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
         // choose a main topic/category/title
         const category = pick(CATEGORIES);
         const topic = pick(TOPICS);
         const title = `${pick(COURSE_TITLES)}${Math.random() < 0.25 ? ' — Practical Projects' : ''}`;
         const subtitle = pick(SUBTITLES);

         const sections = [];
         let totalLectureSeconds = 0;

         // 3 sections each
         for (let s = 0; s < 3; s++) {
            const lectures = [];

            // 4 lectures per section
            for (let l = 0; l < 4; l++) {
               // realistic lecture durations: 3 — 25 minutes (in seconds)
               const durationSecs = faker.number.int({ min: 180, max: 1500 }); // 180s = 3min, 1500s = 25min
               totalLectureSeconds += durationSecs;

               lectures.push({
                  clientId: faker.string.uuid(),
                  title: `${topic} — ${faker.hacker.verb()} ${faker.hacker.noun()}`, // e.g. "React — build component"
                  description: `In this lecture we cover ${topic} ${faker.lorem.sentence(6)}.`,
                  notes: `Key points:\n- ${faker.lorem.sentence()}\n- ${faker.lorem.sentence()}`,
                  order: l + 1,
                  video: {
                     url: VIDEO_POOL[
                        Math.floor(Math.random() * VIDEO_POOL.length)
                     ],
                     fileName: 'lecture.mp4',
                     fileType: 'video/mp4',
                     // store duration in seconds (accurate simulated), can be shown or used later
                     duration: durationSecs,
                  },
                  attachments: [
                     {
                        title: `${topic} example ${l + 1}`,
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
                           fileName: 'caption.vtt',
                           fileType: 'text/vtt',
                        },
                     },
                  ],
               });
            }

            sections.push({
               clientId: faker.string.uuid(),
               title: `${topic} — Part ${s + 1}`,
               order: s + 1,
               lectures,
            });
         }

         // trailer duration: 30 — 180 seconds
         const trailerDuration = faker.number.int({ min: 30, max: 180 });

         // compute course duration in hours (rounded to 1 decimal)
         const hours =
            Math.round(((totalLectureSeconds + trailerDuration) / 3600) * 10) /
               10 || 0.1;

         // assemble course
         const chosenOutcomes = LEARNING_OUTCOMES[topic] || [
            faker.hacker.phrase(),
            faker.hacker.phrase(),
            faker.hacker.phrase(),
            faker.hacker.phrase(),
         ];

         const course = {
            instructor: faker.helpers.arrayElement(instructors)._id,
            status: faker.helpers.arrayElement([
               'draft',
               'review',
               'published',
            ]),
            basicInfo: {
               title,
               subtitle,
               category,
               subCategory: topic,
               topic,
               primaryLanguage: 'English',
               subtitleLanguage: 'Arabic',
               level: faker.helpers.arrayElement(LEVELS),
               // durationValue is the computed hours from lectures
               durationValue: hours,
               durationUnit: 'Hour',
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
                  duration: trailerDuration,
               },
               description: `This course focuses on ${topic} and is designed to help learners ${chosenOutcomes[0].toLowerCase()}. You will work on practical examples and build a mini project by the end.`,
               whatYouWillLearn: chosenOutcomes,
               targetAudience: Array.from({ length: 3 }, () =>
                  pick(TARGET_AUDIENCE_EXAMPLES)
               ),
               requirements: Array.from({ length: 3 }, () =>
                  pick(REQUIREMENTS_EXAMPLES)
               ),
               thumbnailUrl: RANDOM_IMAGE(),
               trailerUrl:
                  VIDEO_POOL[Math.floor(Math.random() * VIDEO_POOL.length)],
               // keep a total duration field (seconds) for internal use
               totalDurationSeconds: totalLectureSeconds + trailerDuration,
            },
            curriculum: {
               sections,
            },
            price: {
               amount: faker.number.int({ min: 0, max: 300 }),
               currency: 'USD',
            },
            tags: uniqueTagsFrom(title, category),
            version: 1,
            lastPublishedAt: new Date(),
         };

         courses.push(course);
      }

      // Save each course to trigger model middleware (slug, etc.)
      for (const course of courses) {
         const doc = new courseModel(course);
         await doc.save();
      }

      console.log(
         '✅ 20 Courses Seeded With Meaningful Data & Realistic Durations!'
      );
      process.exit();
   } catch (err) {
      console.error('❌ Course Seeding Error:', err);
      process.exit(1);
   }
};

seedCourses();
