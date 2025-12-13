import { embeddingsModel } from './openaiClient.js';
import { index } from './pineconeClient.js';

export const generateAndUpsertEmbedding = async (
   courseId,
   text,
   metadata = {}
) => {
   try {
      const embedding = await embeddingsModel.embedQuery(text);

      const record = {
         id: `${courseId}-${Date.now()}`, // Unique ID for the chunk
         values: embedding,
         metadata: {
            courseId: courseId.toString(),
            ...metadata,
         },
      };

      await index.upsert([record]);
      console.log(`Successfully upserted embedding for course: ${courseId}`);
   } catch (error) {
      console.error('Error in generateAndUpsertEmbedding:', error);
      throw error;
   }
};

export const deleteCourseEmbeddings = async (courseId) => {
   try {
      await index.deleteMany({ courseId: courseId.toString() });
      console.log(`Deleted embeddings for course: ${courseId}`);
   } catch (error) {
      console.error('Error deleting course embeddings:', error);
      throw error;
   }
};

export const processCourseForEmbedding = async (course) => {
   if (course.status !== 'published') return; // Only index published courses

   try {
      let content = `Title: ${course.basicInfo.title}\n`;
      content += `Subtitle: ${course.basicInfo.subtitle || ''}\n`;
      content += `Description: ${course.advancedInfo.description || ''}\n`;

      if (course.curriculum && course.curriculum.sections) {
         course.curriculum.sections.forEach((section) => {
            content += `\nSection: ${section.title}\n`;
            section.lectures.forEach((lecture) => {
               content += `  Lecture: ${lecture.title}\n`;
               if (lecture.description)
                  content += `  Summary: ${lecture.description}\n`;
               if (lecture.notes) content += `  Notes: ${lecture.notes}\n`;
            });
         });
      }

      await generateAndUpsertEmbedding(course._id, content, {
         title: course.basicInfo.title,
         instructorId: course.instructor.toString(),
         status: course.status,
      });
   } catch (error) {
      // Log but don't throw - embedding failure shouldn't block course updates
      console.warn(
         '[EmbeddingService] Failed to generate embeddings (OpenAI quota may be exceeded):',
         error.message
      );
   }
};
