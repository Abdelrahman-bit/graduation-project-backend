// libraries
import express from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import cors from 'cors';

// routes
import authRouter from './routes/authRoutes.js';
import courseRouter from './routes/courseRoutes.js';

//global error controller
import globalErrorController from './middleware/errorControllers.js';

// configuration env File for Secret Data
dotenv.config({
   path: './config.env',
});
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
      origin:
         process.env.NODE_ENV === 'production'
            ? process.env.FRONTEND_URL
            : 'http://localhost:3000',
      credentials: true,
   })
);

// Routes
app.use('/api/auth', authRouter);
app.use('/api/courses', courseRouter);

app.use(globalErrorController);

export default app;
