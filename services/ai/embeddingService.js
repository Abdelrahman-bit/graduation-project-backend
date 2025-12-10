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

   // We might chunk this if it's too large, but for now let's try one large chunk or split by section.
   // Simple approach: One document per course for retrieval context?
   // Might be too big for context window if course is huge.
   // Better: Upsert each section as a separate vector?
   // For existing task scope, let's just index the whole summary string.

   // Actually, to make it robust, let's just index the whole text as one chunk for now (or let Pinecone/LangChain split it if we used a splitter).
   // upsertEmbedding below currently takes raw text.
   // We should probably rely on a chunker in a real app, but for this demo, single text block.

   await generateAndUpsertEmbedding(course._id, content, {
      title: course.basicInfo.title,
      instructorId: course.instructor.toString(),
      status: course.status,
   });
};
