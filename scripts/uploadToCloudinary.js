import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({
   path: path.join(__dirname, '..', 'config.env'),
});

// Configure Cloudinary
cloudinary.config({
   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
   api_key: process.env.CLOUDINARY_API_KEY,
   api_secret: process.env.CLOUDINARY_API_SECRET,
   secure: true,
});

// Image folders
const IMGS_DIR = path.join(__dirname, '..', 'imgs');
const COURSES_DIR = path.join(IMGS_DIR, 'courses');
const INSTRUCTORS_DIR = path.join(IMGS_DIR, 'instructors');
const STUDENTS_DIR = path.join(IMGS_DIR, 'students');

// Results storage
const results = {
   courses: {},
   instructors: [],
   students: [],
};

/**
 * Upload a single image to Cloudinary
 */
async function uploadImage(filePath, folder, publicId = null) {
   try {
      const options = {
         folder: `seeder/${folder}`,
         resource_type: 'image',
         overwrite: true,
      };

      if (publicId) {
         options.public_id = publicId;
      }

      const result = await cloudinary.uploader.upload(filePath, options);
      return result.secure_url;
   } catch (error) {
      console.error(`❌ Failed to upload ${filePath}:`, error.message);
      return null;
   }
}

/**
 * Get course title from filename (remove extension)
 */
function getCourseTitle(filename) {
   return path.basename(filename, path.extname(filename));
}

/**
 * Upload all courses images
 */
async function uploadCourses() {
   console.log('\n📚 Uploading Course Images...\n');

   const files = fs.readdirSync(COURSES_DIR);

   for (const file of files) {
      const filePath = path.join(COURSES_DIR, file);
      const courseTitle = getCourseTitle(file);

      console.log(`  📤 Uploading: ${courseTitle}`);

      const url = await uploadImage(
         filePath,
         'courses',
         courseTitle.replace(/[^a-zA-Z0-9]/g, '_')
      );

      if (url) {
         results.courses[courseTitle] = url;
         console.log(`  ✅ Done: ${courseTitle}`);
      }
   }

   console.log(
      `\n✅ Uploaded ${Object.keys(results.courses).length} course images`
   );
}

/**
 * Upload all instructor images
 */
async function uploadInstructors() {
   console.log('\n👨‍🏫 Uploading Instructor Images...\n');

   const files = fs.readdirSync(INSTRUCTORS_DIR).sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)?.[0] || 0);
      const numB = parseInt(b.match(/\d+/)?.[0] || 0);
      return numA - numB;
   });

   for (const file of files) {
      const filePath = path.join(INSTRUCTORS_DIR, file);
      const name = path.basename(file, path.extname(file));

      console.log(`  📤 Uploading: ${name}`);

      const url = await uploadImage(filePath, 'instructors', name);

      if (url) {
         results.instructors.push(url);
         console.log(`  ✅ Done: ${name}`);
      }
   }

   console.log(`\n✅ Uploaded ${results.instructors.length} instructor images`);
}

/**
 * Upload all student images
 */
async function uploadStudents() {
   console.log('\n👨‍🎓 Uploading Student Images...\n');

   const files = fs.readdirSync(STUDENTS_DIR).sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)?.[0] || 0);
      const numB = parseInt(b.match(/\d+/)?.[0] || 0);
      return numA - numB;
   });

   for (const file of files) {
      const filePath = path.join(STUDENTS_DIR, file);
      const name = path.basename(file, path.extname(file));

      console.log(`  📤 Uploading: ${name}`);

      const url = await uploadImage(filePath, 'students', name);

      if (url) {
         results.students.push(url);
         console.log(`  ✅ Done: ${name}`);
      }
   }

   console.log(`\n✅ Uploaded ${results.students.length} student images`);
}

/**
 * Generate output files with URLs
 */
function generateOutputFiles() {
   const outputDir = path.join(__dirname, '..', 'seeders');

   // Generate courses URLs file
   const coursesContent = `// Auto-generated Cloudinary URLs for courses
// Generated on: ${new Date().toISOString()}

export const COURSE_THUMBNAILS = ${JSON.stringify(results.courses, null, 2)};

// Helper function to get thumbnail by course title
export const getCourseThumbnail = (title) => {
   // Try exact match first
   if (COURSE_THUMBNAILS[title]) {
      return COURSE_THUMBNAILS[title];
   }
   
   // Try partial match
   const key = Object.keys(COURSE_THUMBNAILS).find(k => 
      title.toLowerCase().includes(k.toLowerCase()) || 
      k.toLowerCase().includes(title.toLowerCase())
   );
   
   return key ? COURSE_THUMBNAILS[key] : null;
};
`;

   // Generate instructors URLs file
   const instructorsContent = `// Auto-generated Cloudinary URLs for instructors
// Generated on: ${new Date().toISOString()}

export const INSTRUCTOR_AVATARS = ${JSON.stringify(results.instructors, null, 2)};

// Helper to get random instructor avatar
export const getRandomInstructorAvatar = () => {
   return INSTRUCTOR_AVATARS[Math.floor(Math.random() * INSTRUCTOR_AVATARS.length)];
};
`;

   // Generate students URLs file
   const studentsContent = `// Auto-generated Cloudinary URLs for students
// Generated on: ${new Date().toISOString()}

export const STUDENT_AVATARS = ${JSON.stringify(results.students, null, 2)};

// Helper to get random student avatar
export const getRandomStudentAvatar = () => {
   return STUDENT_AVATARS[Math.floor(Math.random() * STUDENT_AVATARS.length)];
};
`;

   // Write files
   fs.writeFileSync(path.join(outputDir, 'courseUrls.js'), coursesContent);
   fs.writeFileSync(
      path.join(outputDir, 'instructorUrls.js'),
      instructorsContent
   );
   fs.writeFileSync(path.join(outputDir, 'studentUrls.js'), studentsContent);

   console.log('\n📁 Output files generated:');
   console.log('   - seeders/courseUrls.js');
   console.log('   - seeders/instructorUrls.js');
   console.log('   - seeders/studentUrls.js');
}

/**
 * Print summary to console
 */
function printSummary() {
   console.log('\n' + '='.repeat(60));
   console.log('📊 UPLOAD SUMMARY');
   console.log('='.repeat(60));

   console.log('\n🎓 COURSE THUMBNAILS:');
   console.log('-'.repeat(40));
   Object.entries(results.courses).forEach(([title, url]) => {
      console.log(`"${title}": "${url}"`);
   });

   console.log('\n👨‍🏫 INSTRUCTOR AVATARS:');
   console.log('-'.repeat(40));
   results.instructors.forEach((url, i) => {
      console.log(`[${i}]: "${url}"`);
   });

   console.log('\n👨‍🎓 STUDENT AVATARS:');
   console.log('-'.repeat(40));
   results.students.forEach((url, i) => {
      console.log(`[${i}]: "${url}"`);
   });

   console.log('\n' + '='.repeat(60));
}

/**
 * Main function
 */
async function main() {
   console.log('🚀 Starting Cloudinary Upload...');
   console.log('='.repeat(60));

   // Verify Cloudinary config
   if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
   ) {
      console.error(
         '❌ Cloudinary configuration missing! Check your config.env file.'
      );
      process.exit(1);
   }

   // Verify image folders exist
   if (!fs.existsSync(IMGS_DIR)) {
      console.error('❌ imgs folder not found!');
      process.exit(1);
   }

   try {
      await uploadCourses();
      await uploadInstructors();
      await uploadStudents();

      generateOutputFiles();
      printSummary();

      console.log('\n✅ All uploads completed successfully!');
   } catch (error) {
      console.error('❌ Upload failed:', error);
      process.exit(1);
   }
}

main();
