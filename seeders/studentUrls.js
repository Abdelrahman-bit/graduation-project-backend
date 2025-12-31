// Auto-generated Cloudinary URLs for students
// Generated on: 2025-12-14T16:02:23.187Z

export const STUDENT_AVATARS = [
   'https://res.cloudinary.com/dzcjymfa3/image/upload/v1765728013/seeder/students/student1.jpg',
   'https://res.cloudinary.com/dzcjymfa3/image/upload/v1765728029/seeder/students/student2.jpg',
   'https://res.cloudinary.com/dzcjymfa3/image/upload/v1765728042/seeder/students/student3.jpg',
   'https://res.cloudinary.com/dzcjymfa3/image/upload/v1765728046/seeder/students/student4.jpg',
   'https://res.cloudinary.com/dzcjymfa3/image/upload/v1765728052/seeder/students/student5.jpg',
   'https://res.cloudinary.com/dzcjymfa3/image/upload/v1765728055/seeder/students/student6.jpg',
   'https://res.cloudinary.com/dzcjymfa3/image/upload/v1765728104/seeder/students/student8.jpg',
   'https://res.cloudinary.com/dzcjymfa3/image/upload/v1765728123/seeder/students/student9.jpg',
   'https://res.cloudinary.com/dzcjymfa3/image/upload/v1765728142/seeder/students/student10.jpg',
];

// Helper to get random student avatar
export const getRandomStudentAvatar = () => {
   return STUDENT_AVATARS[Math.floor(Math.random() * STUDENT_AVATARS.length)];
};
