// Auto-generated Cloudinary URLs for courses
// Generated on: 2025-12-14T16:02:23.185Z

export const COURSE_THUMBNAILS = {
   'Content Marketing':
      'https://res.cloudinary.com/dzcjymfa3/image/upload/v1765727738/seeder/courses/Content_Marketing.jpg',
   'Cursor AI for Android App Development to Code Faster':
      'https://res.cloudinary.com/dzcjymfa3/image/upload/v1765727753/seeder/courses/Cursor_AI_for_Android_App_Development_to_Code_Faster.jpg',
   'Develop Creativity Proven Methods for Innovative Thinking':
      'https://res.cloudinary.com/dzcjymfa3/image/upload/v1765727758/seeder/courses/Develop_Creativity_Proven_Methods_for_Innovative_Thinking.jpg',
   'Frontend Performance Optimization':
      'https://res.cloudinary.com/dzcjymfa3/image/upload/v1765727762/seeder/courses/Frontend_Performance_Optimization.jpg',
   'Full-Stack MERN E-Commerce':
      'https://res.cloudinary.com/dzcjymfa3/image/upload/v1765727764/seeder/courses/Full_Stack_MERN_E_Commerce.jpg',
   'Generative AI for Beginners':
      'https://res.cloudinary.com/dzcjymfa3/image/upload/v1765727776/seeder/courses/Generative_AI_for_Beginners.jpg',
   'How to make Content Strategy':
      'https://res.cloudinary.com/dzcjymfa3/image/upload/v1765727786/seeder/courses/How_to_make_Content_Strategy.jpg',
   'Intro to Machine Learning with Python':
      'https://res.cloudinary.com/dzcjymfa3/image/upload/v1765727791/seeder/courses/Intro_to_Machine_Learning_with_Python.jpg',
   'Modern React with Hooks & Context':
      'https://res.cloudinary.com/dzcjymfa3/image/upload/v1765727810/seeder/courses/Modern_React_with_Hooks___Context.jpg',
   'Node.js REST APIs from Zero to Production':
      'https://res.cloudinary.com/dzcjymfa3/image/upload/v1765727815/seeder/courses/Node_js_REST_APIs_from_Zero_to_Production.jpg',
   'Practical PostgreSQL for Developers (2)':
      'https://res.cloudinary.com/dzcjymfa3/image/upload/v1765727825/seeder/courses/Practical_PostgreSQL_for_Developers__2_.jpg',
   'Rank in Google with SEO':
      'https://res.cloudinary.com/dzcjymfa3/image/upload/v1765727830/seeder/courses/Rank_in_Google_with_SEO.jpg',
   'Secure Web Authentication (JWT & OAuth)':
      'https://res.cloudinary.com/dzcjymfa3/image/upload/v1765727835/seeder/courses/Secure_Web_Authentication__JWT___OAuth_.jpg',
   'SEO Training Masterclass 2025 Beginner To Advanced SEO':
      'https://res.cloudinary.com/dzcjymfa3/image/upload/v1765727839/seeder/courses/SEO_Training_Masterclass_2025_Beginner_To_Advanced_SEO.jpg',
   'Testing JavaScript Apps (Jest + RTL)':
      'https://res.cloudinary.com/dzcjymfa3/image/upload/v1765727853/seeder/courses/Testing_JavaScript_Apps__Jest___RTL_.jpg',
   'The Complete Digital Marketing Guide':
      'https://res.cloudinary.com/dzcjymfa3/image/upload/v1765727859/seeder/courses/The_Complete_Digital_Marketing_Guide.jpg',
   'Three.js 3D Web Experiences':
      'https://res.cloudinary.com/dzcjymfa3/image/upload/v1765727861/seeder/courses/Three_js_3D_Web_Experiences.jpg',
   'TypeScript for JavaScript Developers':
      'https://res.cloudinary.com/dzcjymfa3/image/upload/v1765727866/seeder/courses/TypeScript_for_JavaScript_Developers.jpg',
   'Unleash Your Innovation Now!':
      'https://res.cloudinary.com/dzcjymfa3/image/upload/v1765727871/seeder/courses/Unleash_Your_Innovation_Now_.jpg',
   'Vidoe Editting':
      'https://res.cloudinary.com/dzcjymfa3/image/upload/v1765727877/seeder/courses/Vidoe_Editting.jpg',
};

// Helper function to get thumbnail by course title
export const getCourseThumbnail = (title) => {
   // Try exact match first
   if (COURSE_THUMBNAILS[title]) {
      return COURSE_THUMBNAILS[title];
   }

   // Try partial match
   const key = Object.keys(COURSE_THUMBNAILS).find(
      (k) =>
         title.toLowerCase().includes(k.toLowerCase()) ||
         k.toLowerCase().includes(title.toLowerCase())
   );

   return key ? COURSE_THUMBNAILS[key] : null;
};
