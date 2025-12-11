import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import dotenv from 'dotenv';
dotenv.config({ path: './config.env' }); // Adjust path if needed

async function test() {
   console.log('Running streamText test...');
   try {
      const result = await streamText({
         model: openai('gpt-4o-mini'),
         messages: [{ role: 'user', content: 'hello' }],
      });

      console.log('Result keys:', Object.keys(result));
      console.log(
         'Has toDataStreamResponse:',
         typeof result.toDataStreamResponse
      );
      console.log(
         'Has toTextStreamResponse:',
         typeof result.toTextStreamResponse
      );
      console.log('Result prototype:', Object.getPrototypeOf(result));

      // Check if methods are on prototype
      if (Object.getPrototypeOf(result)) {
         console.log(
            'Prototype keys:',
            Object.getOwnPropertyNames(Object.getPrototypeOf(result))
         );
      }
   } catch (e) {
      console.error('Error:', e);
   }
}

test();
