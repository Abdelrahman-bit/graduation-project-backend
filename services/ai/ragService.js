import { index } from './pineconeClient.js';
import { embeddingsModel } from './openaiClient.js';

export const getRelevantContext = async (query, filter = {}) => {
   try {
      const queryEmbedding = await embeddingsModel.embedQuery(query);

      const queryResponse = await index.query({
         vector: queryEmbedding,
         topK: 5,
         includeMetadata: true,
         filter: filter, // Used to restrict search to enrolled courses
      });

      if (!queryResponse.matches || queryResponse.matches.length === 0) {
         return '';
      }

      return queryResponse.matches
         .map(
            (match) =>
               match.metadata.text ||
               match.metadata.content ||
               JSON.stringify(match.metadata)
         )
         .join('\n\n---\n\n');
   } catch (error) {
      console.error('Error in getRelevantContext:', error);
      return ''; // Fail gracefully
   }
};
