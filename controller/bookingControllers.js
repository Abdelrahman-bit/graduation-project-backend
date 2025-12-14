import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

import bookingModel from '../models/BookingModel.js';
import slotmodel from '../models/slotModel.js';
import usersModel from '../models/usersModel.js';
import Notification from '../models/notificationModel.js';
import Enrollment from '../models/enrollmentModel.js';
import ChatGroup from '../models/chatGroupModel.js';
import ChatMessage from '../models/chatMessageModel.js';
import Ably from 'ably';

// Initialize Ably REST client for publishing
const getAblyClient = () => {
   const apiKey = process.env.ABLY_API_KEY;
   if (!apiKey) {
      console.warn(
         '[Booking] ABLY_API_KEY not set, real-time updates disabled'
      );
      return null;
   }
   return new Ably.Rest(apiKey);
};

// Get user bookings
export const getMyBookings = catchAsync(async (req, res, next) => {
   const { id } = req.user;
   const bookings = await bookingModel.find({ user: id }).populate('slot hall');
   res.status(200).json({
      status: 'success',
      results: bookings.length,
      data: bookings,
   });
});

// Create a new booking
export const createBooking = catchAsync(async (req, res, next) => {
   const { slot: slotId, course: courseId } = req.body;
   const userId = req.user.id;
   const user = req.user; // Assuming full user object is attached by auth middleware

   if (!courseId) {
      return next(new AppError('Please select a course for this booking', 400));
   }

   // Validate Course
   const course = await import('../models/courseModel.js').then((m) =>
      m.default.findById(courseId)
   );

   if (!course) {
      return next(new AppError('Course not found', 404));
   }

   if (course.instructor.toString() !== userId && user.role !== 'admin') {
      return next(
         new AppError('You can only book halls for your own courses', 403)
      );
   }

   if (course.status !== 'published') {
      return next(
         new AppError('You can only book halls for published courses', 400)
      );
   }

   console.log(slotId);
   // Check if slot exists
   const slot = await slotmodel.findById(slotId).populate('hall');
   if (!slot) {
      return next(new AppError('Slot not found', 404));
   }

   // 1.5 Check if hall is in maintenance mode
   if (slot.hall.isBookable === false) {
      return next(
         new AppError(
            'This hall is currently under maintenance and cannot be booked.',
            400
         )
      );
   }
   // 2️ Prevent double booking
   const existingBooking = await bookingModel.findOne({ slot: slotId });
   if (existingBooking) {
      return next(new AppError('Slot already booked', 400));
   }
   // 3️⃣ Create booking
   const booking = await bookingModel.create({
      user: userId,
      hall: slot.hall._id, // Access _id since we populated
      slot: slotId,
      course: courseId,
   });

   // 4️⃣ Notify Admins
   const admins = await usersModel.find({ role: 'admin' });

   if (admins.length > 0) {
      const startTime = new Date(slot.startTime).toLocaleTimeString([], {
         hour: '2-digit',
         minute: '2-digit',
      });
      const dateStr = new Date(slot.startTime).toLocaleDateString();
      const hallName = slot.hall.name || 'a hall';
      const instructorName = user.firstname
         ? `${user.firstname} ${user.lastname}`
         : 'An Instructor';

      const notifications = admins.map((admin) => ({
         recipient: admin._id,
         type: 'system',
         title: 'New Hall Booking',
         message: `Instructor ${instructorName} booked ${hallName} for ${dateStr} at ${startTime}.`,
         isRead: false,
         priority: 'normal',
      }));
   }

   // 5️⃣ Notify Enrolled Students & Send Course Chat
   const enrollments = await Enrollment.find({
      course: courseId,
      status: 'active',
   }).populate('student', 'firstname lastname avatar email');

   console.log(
      `[Booking] Found ${enrollments.length} active enrollments for course ${courseId}`
   );

   if (enrollments.length > 0) {
      const startTime = new Date(slot.startTime).toLocaleTimeString([], {
         hour: '2-digit',
         minute: '2-digit',
      });
      const dateStr = new Date(slot.startTime).toLocaleDateString();
      const hallName = slot.hall.name || 'a hall';
      const instructorName = user.firstname
         ? `${user.firstname} ${user.lastname}`
         : 'The Instructor';

      const bookingMessage = `📢 New Hall Booking: ${instructorName} has booked ${hallName} for ${dateStr} at ${startTime}.`;

      // A. Create Notifications for Students
      const studentNotifications = enrollments.map((enr) => ({
         recipient: enr.student._id,
         type: 'instructor_message',
         title: 'New Class Session Booked',
         message: bookingMessage,
         isRead: false,
         priority: 'high',
         relatedCourse: courseId,
      }));

      const createdNotifications =
         await Notification.insertMany(studentNotifications);

      // Publish Notifications via Ably
      try {
         const ably = getAblyClient();
         if (ably) {
            const publishPromises = createdNotifications.map(async (notif) => {
               const channel = ably.channels.get(
                  `notifications:${notif.recipient}`
               );
               await channel.publish('new_notification', {
                  ...notif.toObject(),
                  // _id is now the real ObjectId from mongo
               });
            });
            // Don't await individual publishes to speed up response
            Promise.all(publishPromises).catch((err) =>
               console.error('[Booking] Ably Notif Error:', err)
            );
         }
      } catch (err) {
         console.error(
            '[Booking] Failed to publish notifications via Ably:',
            err
         );
      }

      // B. Send System Message to Course Chat Group
      try {
         const chatGroup = await ChatGroup.findOne({ course: courseId });

         console.log(
            `[Booking] Found chat group for course ${courseId}: ${chatGroup ? chatGroup._id : 'NONE'}`
         );

         if (chatGroup) {
            // Create system message
            await ChatMessage.createSystemMessage(
               chatGroup._id,
               bookingMessage,
               { type: 'booking', bookingId: booking._id }
            );

            // Update last message timestamp
            await ChatGroup.findByIdAndUpdate(chatGroup._id, {
               lastMessageAt: new Date(),
            });

            // Increment unread counts for all members
            // Note: System messages are attributed to admin (instructor),
            // so we increment for everyone except admin (technically admin is sender)
            // But since this is automated, we want everyone to see it.
            // Let's assume the helper increments for everyone except 'sender'.
            // createSystemMessage uses group.admin as sender.
            await ChatGroup.incrementUnreadCounts(
               chatGroup._id,
               chatGroup.admin
            );

            // Publish Message via Ably
            try {
               const ably = getAblyClient();
               if (ably) {
                  const channel = ably.channels.get(`chat:${chatGroup._id}`);
                  // Fetch real message if we needed the ID, but here we used createSystemMessage
                  // createSystemMessage returns the document.
                  // Wait, createSystemMessage in my code block above was awaited but result not captured.
                  // I need to capture it or just send the payload.
                  // Let's assume payload is enough for basic update, but for consistency lets optimize.
                  // Actually, I can just construct the event data.
                  await channel.publish('message', {
                     chatGroup: chatGroup._id,
                     content: bookingMessage,
                     messageType: 'system',
                     sender: {
                        firstname: 'System',
                        lastname: '',
                        avatar: '/default-avatar.png', // Placeholder or system avatar
                     },
                     createdAt: new Date(),
                     metadata: { type: 'booking', bookingId: booking._id },
                  });
               }
            } catch (ablyErr) {
               console.error(
                  '[Booking] Failed to publish chat message via Ably:',
                  ablyErr
               );
            }
         }
      } catch (err) {
         console.error('Failed to send booking chat message:', err);
         // Don't fail the booking if chat fails
      }
   }

   res.status(201).json({
      status: 'success',
      data: booking,
   });
});

// Cancel a booking
export const cancelBooking = catchAsync(async (req, res, next) => {
   const { id } = req.params;
   const userId = req.user._id;
   const userRole = req.user.role;

   const booking = await bookingModel.findById(id).populate('slot hall course');

   if (!booking) {
      return next(new AppError('Booking not found', 404));
   }

   // Authorization: Only owner or admin can cancel
   if (booking.user.toString() !== userId.toString() && userRole !== 'admin') {
      return next(
         new AppError('You are not authorized to cancel this booking', 403)
      );
   }

   // 1. Prepare Cancellation Message
   const startTime = new Date(booking.slot.startTime).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
   });
   const dateStr = new Date(booking.slot.startTime).toLocaleDateString();
   const hallName = booking.hall.name || 'a hall';

   // If the user cancelling is the instructor, use their name.
   // If admin, use "System/Admin" or keep it generic.
   const cancelMessage = `⚠️ CLASS CANCELLED: The session at ${hallName} on ${dateStr} at ${startTime} has been cancelled.`;

   // 2. Notify Enrolled Students & Send Course Chat
   if (booking.course) {
      const enrollments = await Enrollment.find({
         course: booking.course._id,
         status: 'active',
      }).populate('student', '_id');

      if (enrollments.length > 0) {
         // A. Create Notifications for Students
         const studentNotifications = enrollments.map((enr) => ({
            recipient: enr.student._id,
            type: 'system', // or 'instructor_message'
            title: 'Class Session Cancelled',
            message: cancelMessage,
            isRead: false,
            priority: 'high',
            relatedCourse: booking.course._id,
         }));

         const createdNotifications =
            await Notification.insertMany(studentNotifications);

         // Publish Notifications via Ably
         try {
            const ably = getAblyClient();
            if (ably) {
               const publishPromises = createdNotifications.map(
                  async (notif) => {
                     const channel = ably.channels.get(
                        `notifications:${notif.recipient}`
                     );
                     await channel.publish('new_notification', {
                        ...notif.toObject(),
                     });
                  }
               );
               Promise.all(publishPromises).catch((err) =>
                  console.error('[Cancellation] Ably Notif Error:', err)
               );
            }
         } catch (err) {
            console.error(
               '[Cancellation] Failed to publish notifications via Ably:',
               err
            );
         }

         // B. Send System Message to Course Chat Group
         try {
            const chatGroup = await ChatGroup.findOne({
               course: booking.course._id,
            });

            if (chatGroup) {
               // Create system message
               await ChatMessage.createSystemMessage(
                  chatGroup._id,
                  cancelMessage,
                  { type: 'cancellation', bookingId: booking._id }
               );

               // Update last message timestamp
               await ChatGroup.findByIdAndUpdate(chatGroup._id, {
                  lastMessageAt: new Date(),
               });

               await ChatGroup.incrementUnreadCounts(
                  chatGroup._id,
                  chatGroup.admin
               );

               // Publish Message via Ably
               try {
                  const ably = getAblyClient();
                  if (ably) {
                     const channel = ably.channels.get(`chat:${chatGroup._id}`);
                     await channel.publish('message', {
                        chatGroup: chatGroup._id,
                        content: cancelMessage,
                        messageType: 'system',
                        sender: {
                           firstname: 'System',
                           lastname: '',
                           avatar: '/default-avatar.png',
                        },
                        createdAt: new Date(),
                        metadata: {
                           type: 'cancellation',
                           bookingId: booking._id,
                        },
                     });
                  }
               } catch (ablyErr) {
                  console.error(
                     '[Cancellation] Failed to publish chat message via Ably:',
                     ablyErr
                  );
               }
            }
         } catch (err) {
            console.error('Failed to send cancellation chat message:', err);
         }
      }
   }

   // 3. Delete Booking
   await bookingModel.findByIdAndDelete(id);

   res.status(204).json({
      status: 'success',
      data: null,
   });
});
