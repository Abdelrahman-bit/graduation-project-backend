import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import userModel from '../models/usersModel.js';
import ChatGroup from '../models/chatGroupModel.js';
import ChatMessage from '../models/chatMessageModel.js';

/**
 * Initialize Socket.IO server with authentication and event handlers
 * @param {http.Server} httpServer - The HTTP server instance
 * @returns {Server} - The Socket.IO server instance
 */
export const initializeSocketServer = (httpServer) => {
   const io = new Server(httpServer, {
      cors: {
         origin: process.env.FRONTEND_URL || 'http://localhost:3000',
         methods: ['GET', 'POST'],
         credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
   });

   // Authentication middleware
   io.use(async (socket, next) => {
      try {
         const token = socket.handshake.auth.token;

         if (!token) {
            return next(new Error('Authentication required'));
         }

         // Verify JWT
         const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
         const user = await userModel.findById(decoded.id).select('-password');

         if (!user) {
            return next(new Error('User not found'));
         }

         // Attach user to socket
         socket.user = user;
         next();
      } catch (error) {
         console.error('[Socket] Auth error:', error.message);
         next(new Error('Invalid or expired token'));
      }
   });

   // Connection handler
   io.on('connection', async (socket) => {
      const userId = socket.user._id.toString();
      console.log(
         `[Socket] User connected: ${socket.user.firstname} (${userId})`
      );

      // Join user's personal room for direct notifications
      socket.join(`user:${userId}`);

      // Auto-join all chat rooms the user is a member of
      try {
         const chatGroups = await ChatGroup.find({
            $or: [{ admin: userId }, { members: userId }],
         }).select('_id');

         chatGroups.forEach((group) => {
            const roomName = `chat:${group._id}`;
            socket.join(roomName);
            console.log(`[Socket] User ${userId} joined room: ${roomName}`);
         });
      } catch (error) {
         console.error('[Socket] Error joining rooms:', error.message);
      }

      // Handle joining a specific chat room
      socket.on('join_room', async (data) => {
         const { groupId } = data;

         try {
            const chatGroup = await ChatGroup.findById(groupId);

            if (!chatGroup) {
               socket.emit('error', { message: 'Chat group not found' });
               return;
            }

            // Verify user has access
            const isMember = chatGroup.isMember(userId);
            const isAdmin = chatGroup.admin.toString() === userId;

            if (!isMember && !isAdmin) {
               socket.emit('error', { message: 'Access denied to chat group' });
               return;
            }

            const roomName = `chat:${groupId}`;
            socket.join(roomName);
            socket.emit('room_joined', { groupId, roomName });
            console.log(`[Socket] User ${userId} joined room: ${roomName}`);
         } catch (error) {
            console.error('[Socket] Error joining room:', error.message);
            socket.emit('error', { message: 'Failed to join chat room' });
         }
      });

      // Handle leaving a chat room
      socket.on('leave_room', (data) => {
         const { groupId } = data;
         const roomName = `chat:${groupId}`;
         socket.leave(roomName);
         console.log(`[Socket] User ${userId} left room: ${roomName}`);
      });

      // Handle sending a message
      socket.on('send_message', async (data) => {
         const { groupId, content } = data;

         if (!content || !content.trim()) {
            socket.emit('error', { message: 'Message content is required' });
            return;
         }

         try {
            const chatGroup = await ChatGroup.findById(groupId);

            if (!chatGroup) {
               socket.emit('error', { message: 'Chat group not found' });
               return;
            }

            // Check if user can send messages
            if (!chatGroup.canSendMessage(socket.user._id)) {
               if (chatGroup.settings.instructorOnlyMode) {
                  socket.emit('error', {
                     message:
                        'Only the instructor can send messages in this chat',
                  });
               } else {
                  socket.emit('error', {
                     message: 'You cannot send messages to this chat',
                  });
               }
               return;
            }

            // Create the message
            const message = await ChatMessage.create({
               chatGroup: groupId,
               sender: socket.user._id,
               content: content.trim(),
            });

            // Update last message timestamp
            await ChatGroup.findByIdAndUpdate(groupId, {
               lastMessageAt: new Date(),
            });

            // Populate sender info
            await message.populate('sender', 'firstname lastname avatar');

            const messageData = {
               ...message.toObject(),
               chatGroup: groupId,
            };

            // Broadcast to all users in the room (including sender)
            io.to(`chat:${groupId}`).emit('new_message', messageData);

            // Acknowledge to sender
            socket.emit('message_sent', {
               success: true,
               message: messageData,
            });
         } catch (error) {
            console.error('[Socket] Error sending message:', error.message);
            socket.emit('error', { message: 'Failed to send message' });
         }
      });

      // Handle typing indicator
      socket.on('typing_start', (data) => {
         const { groupId } = data;
         socket.to(`chat:${groupId}`).emit('user_typing', {
            userId,
            user: {
               firstname: socket.user.firstname,
               lastname: socket.user.lastname,
            },
         });
      });

      socket.on('typing_stop', (data) => {
         const { groupId } = data;
         socket.to(`chat:${groupId}`).emit('user_stopped_typing', { userId });
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
         console.log(
            `[Socket] User disconnected: ${userId}, reason: ${reason}`
         );
      });

      // Handle errors
      socket.on('error', (error) => {
         console.error(`[Socket] Error for user ${userId}:`, error);
      });
   });

   console.log('[Socket] Socket.IO server initialized');
   return io;
};

export default initializeSocketServer;
