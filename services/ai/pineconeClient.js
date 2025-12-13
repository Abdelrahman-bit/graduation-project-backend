import { Pinecone } from '@pinecone-database/pinecone';

if (!process.env.PINECONE_API_KEY) {
   throw new Error('Missing PINECONE_API_KEY environment variable');
}

const pinecone = new Pinecone({
   apiKey: process.env.PINECONE_API_KEY,
});

export const index = pinecone.index(
   process.env.PINECONE_INDEX_NAME || 'lms-courses'
);
export default pinecone;
