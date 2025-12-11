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

//global error controller
import globalErrorController from './middleware/errorControllers.js';

// configure the Express application instance
const app = express();

// Global Middlewares
// Helmet : auto includes the Security protocols / headers along each request
app.use(helmet());

//(express-rate-limit) will limit the number of request coming from same domain in a ranged time (help against prudeForce, DoS attacks)
const limiter = rateLimit({
   limit: 100,
   windowMs: 60 * 60 * 1000, // 1 hour
   message: 'Max request count Reached try again in 1 hour',
});
app.use('/api', limiter);

// well confiqure each request to json to be able to extract body data
app.use(express.json());

// cors will allow frontend requests coming to the backend from different domains
app.use(
   cors({
      origin: 'http://localhost:3000',
      credentials: true,
   })
);

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

app.use(globalErrorController);

export default app;
