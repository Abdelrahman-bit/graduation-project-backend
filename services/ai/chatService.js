import { streamText, convertToModelMessages } from 'ai';
import { openai } from '@ai-sdk/openai';
import { getRelevantContext } from './ragService.js';
import { getToolsForRole, getToolNamesForRole } from './tools/index.js';
import Enrollment from '../../models/enrollmentModel.js';

console.log(
   '✅ chatService.js LOADED - if you see this, the file is being imported'
);

const SYSTEM_PROMPTS = {
   guest: `You are a helpful assistant for an Online Learning Platform. 
   You help visitors understand what the platform is, how to sign up, and how to become an instructor.
   
   To become an instructor:
   1. click (become instructor) in the footer to go to become instructor page.
   2. fill in your instructor info with your email, firstname, lastname and phone number
   3. wait for the admin to take action eather acceptance or rejection.
   4. once accepted an email will be sent to you with your instructor credentials.
   5. Create your first course and submit it for review
   6. Once approved, your course will be published and visible to students
   
   You can list categories like Development, Business, Design, etc.
   DO NOT answer specific questions about private user data. 
   If they ask for specific course content, ask them to log in.`,

   student: `You are a helpful learning assistant for a student on an Online Learning Platform.
   You help students with their enrolled courses and learning journey.
   
   IMPORTANT: You have access to the following tools that you MUST use when asked relevant questions:
   - getMyEnrollments: Use this to list the courses the student is enrolled in
   - getEnrollmentCount: Use this to count how many courses the student is enrolled in
   
   When the student asks about their enrollments, courses, or how many courses they have:
   1. ALWAYS call the appropriate tool first
   2. Then provide the answer based on the tool result
   3. Do NOT say you cannot access their data - you CAN access it via tools
   
   If the student asks about platform analytics (e.g. "how many users"), politely refuse.
   If they ask about course content, use any provided RAG context to help them.`,

   instructor: `You are an assistant for Instructors/Teachers.
   You can help them check their course status and see their student stats.
   
   You have access to tools to:
   - Get your own course and student statistics
   - Check the approval status of a specific course by name
   
   Use these tools when asked about your courses or stats.`,

   admin: `You are an internal admin assistant.
   You have access to platform-wide statistics.
   
   You have access to tools to:
   - Get platform-wide statistics (users, courses, enrollments)
   
   Use this tool when asked about platform metrics, growth, or health.`,
};

export const handleChat = async ({ messages, user, userId }) => {
   // 1. Determine user role
   const role = user?.role || 'guest';
   let systemPrompt = SYSTEM_PROMPTS[role] || SYSTEM_PROMPTS.guest;

   // 2. Get tools for this role
   const tools = getToolsForRole(role, userId);
   const toolNames = getToolNamesForRole(role);

   // 3. Add user context for personalized responses
   if (user && role !== 'guest') {
      const userName = user.firstname || 'there';
      const fullName =
         user.firstname && user.lastname
            ? `${user.firstname} ${user.lastname}`
            : userName;
      const userContext = `
--- USER CONTEXT ---
You are speaking with ${fullName}.
- Name: ${userName}
- Role: ${role}
- User ID: ${userId}

IMPORTANT: Be friendly and personalized. Use their first name "${userName}" when appropriate to make the conversation more engaging.
For example: "Hi ${userName}!", "Great question, ${userName}!", "${userName}, you have X courses..."
--- END USER CONTEXT ---
`;
      systemPrompt = userContext + '\n' + systemPrompt;
   }

   console.log(`[ChatService] ===== CHAT REQUEST =====`);
   console.log(
      `[ChatService] User role: ${role}, userId: ${userId}, name: ${user?.firstname || 'Guest'}`
   );
   console.log(`[ChatService] Tools available: [${toolNames.join(', ')}]`);
   console.log(
      `[ChatService] Tools object:`,
      tools ? Object.keys(tools) : 'undefined'
   );

   // 3. Get user's last message for RAG query
   const lastUserMessage = [...messages]
      .reverse()
      .find((m) => m.role === 'user');
   const query = lastUserMessage?.content || lastUserMessage?.text || '';

   console.log(`[ChatService] Query: "${query.substring(0, 80)}..."`);

   // 4. Fetch RAG context based on role
   let context = '';
   try {
      if (role === 'student' && userId) {
         // For students: filter by their enrolled courses
         const enrollments = await Enrollment.find({ user: userId }).select(
            'course'
         );
         const courseIds = enrollments.map((e) => e.course.toString());
         console.log(
            `[ChatService] Student enrolled in ${courseIds.length} courses`
         );

         if (courseIds.length > 0) {
            context = await getRelevantContext(query, {
               courseId: { $in: courseIds },
            });
         }
      } else if (role === 'instructor' && userId) {
         // For instructors: filter by courses they created
         context = await getRelevantContext(query, {
            instructorId: userId.toString(),
         });
      } else if (role === 'admin') {
         // Admins get full access to all context
         context = await getRelevantContext(query);
      }
      // Guests get no RAG context (just platform info from system prompt)
   } catch (ragError) {
      console.error('[ChatService] RAG error:', ragError);
      // Continue without context if RAG fails
   }

   // 5. Inject context into system prompt if we have any
   if (context && context.trim()) {
      console.log(
         `[ChatService] Adding ${context.length} chars of RAG context`
      );
      systemPrompt += `\n\n--- RELEVANT CONTEXT FROM COURSE MATERIALS ---\n${context}\n--- END CONTEXT ---\n\nUse the above context to answer questions about course content when relevant.`;
   }

   // 6. Stream response with system prompt and tools
   const result = streamText({
      model: openai('gpt-4o-mini'),
      system: systemPrompt,
      messages: convertToModelMessages(messages),
      tools,
      maxSteps: 3, // Allow multi-step tool calls so AI can use results
      onStepFinish: (stepResult) => {
         // In AI SDK v5, stepResult contains the full step info
         console.log(`[ChatService] ===== STEP FINISHED =====`);
         console.log(`[ChatService] Step type: ${stepResult.stepType}`);
         console.log(`[ChatService] Finish reason: ${stepResult.finishReason}`);

         if (stepResult.toolCalls?.length) {
            console.log(
               `[ChatService] Tool calls:`,
               stepResult.toolCalls.map((t) => t.toolName)
            );
         }

         if (stepResult.toolResults?.length) {
            // In SDK v5, toolResults is an array with objects containing toolCallId, toolName, and result
            console.log(
               `[ChatService] Tool results:`,
               JSON.stringify(stepResult.toolResults, null, 2)
            );
         }

         if (stepResult.text) {
            console.log(
               `[ChatService] Text generated: ${stepResult.text.substring(0, 200)}...`
            );
         }
      },
      onFinish: (finalResult) => {
         console.log(`[ChatService] ===== STREAM FINISHED =====`);
         console.log(
            `[ChatService] Total steps: ${finalResult.steps?.length || 0}`
         );
         if (finalResult.text) {
            console.log(
               `[ChatService] Final text: ${finalResult.text.substring(0, 200)}...`
            );
         }
      },
   });

   return result;
};
