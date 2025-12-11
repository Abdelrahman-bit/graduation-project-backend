import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';

if (!process.env.OPENAI_API_KEY) {
   throw new Error('Missing OPENAI_API_KEY environment variable');
}

// For Chat completions (Main execution model)
export const chatModel = new ChatOpenAI({
   modelName: 'gpt-4-turbo-preview', // Using a consistently capable model
   temperature: 0,
});

// For Embeddings
export const embeddingsModel = new OpenAIEmbeddings({
   model: 'text-embedding-3-small',
});
