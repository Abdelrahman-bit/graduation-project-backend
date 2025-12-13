// libraries
import express from 'express';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import cors from 'cors';

// routes
import authRouter from './routes/authRoutes.js';
import instructorRouter from './routes/instructorRoutes.js';
import adminRouter from './routes/adminRoutes.js';
import courseRouter from './routes/courseRoutes.js';
import studentRouter from './routes/studentRoutes.js';
import hallRouter from './routes/hallRoutes.js';
import bookingRouter from './routes/bookingRoutes.js';
import slotRouter from './routes/slotRoutes.js';
import userRouter from './routes/userRoutes.js';
import chatRouter from './routes/chatRoutes.js';
import ablyRouter from './routes/ablyRoutes.js';

//global error controller
import globalErrorController from './middleware/errorControllers.js';

// configure the Express application instance
const app = express();

// Global Middlewares

// CORS must come FIRST before helmet to prevent header conflicts
app.use(
   cors({
      origin:
         process.env.FRONTEND_URL?.replace(/\/$/, '') ||
         'http://localhost:3000',
      credentials: true,
   })
);

// Helmet : auto includes the Security protocols / headers along each request
app.use(helmet());

//(express-rate-limit) will limit the number of request coming from same domain in a ranged time (help against prudeForce, DoS attacks)
const limiter = rateLimit({
   limit: 1000,
   windowMs: 60 * 60 * 1000, // 1 hour
   message: 'Max request count Reached try again in 1 hour',
});
app.use('/api', limiter);

// well confiqure each request to json to be able to extract body data
app.use(express.json());

// Routes
// authentication routes
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);

// users routes
app.use('/api/instructor', instructorRouter);
app.use('/api/student', studentRouter);
app.use('/api/courses', courseRouter);
app.use('/api/user', userRouter);

// features routes
app.use('/api/hall', hallRouter);
app.use('/api/booking', bookingRouter);
app.use('/api/slot', slotRouter);

// AI Chat Routes
import aiRouter from './routes/aiRoutes.js';
app.use('/api/chat', aiRouter);

// Course Chat Routes (Real-time messaging)
app.use('/api/chats', chatRouter);

// Ably Routes (Real-time token authentication)
app.use('/api/ably', ablyRouter);

// Notification Routes
import notificationRouter from './routes/notificationRoutes.js';
app.use('/api/notifications', notificationRouter);

app.use(globalErrorController);

export default app;
