import { handleChat } from '../services/ai/chatService.js';

export const chatWithAI = async (req, res, next) => {
   try {
      console.log('Chat Request Body:', req.body);
      console.log(
         'Chat Auth Header:',
         req.headers.authorization ? 'Bearer ***' : 'NONE'
      );
      console.log(
         'Chat User:',
         req.user ? { id: req.user._id, role: req.user.role } : 'GUEST'
      );
      const { messages } = req.body;
      const user = req.user;

      if (!messages) {
         return res
            .status(400)
            .json({ error: 'No messages provided in request body' });
      }

      // messages might be a single object from 'sendMessage' call payload { role, content }
      // or an array from standard useChat. Ensure it is an array.
      const messageArray = Array.isArray(messages) ? messages : [messages];

      const result = await handleChat({
         messages: messageArray,
         user,
         userId: user ? user._id : null,
      });

      // Use pipeUIMessageStreamToResponse for Express.js
      result.pipeUIMessageStreamToResponse(res);
   } catch (error) {
      console.error('Error in chatWithAI:', error);
      next(error);
   }
};
