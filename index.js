import express from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import errorHandler from './middleware/errorHandler';
import { connectDB } from './utils/db';

dotenv.config();
app.use(express.json());
app.use(helmet());
app.use(
   cors({
      origin:
         process.env.NODE_ENV === 'production'
            ? process.env.FRONTEND_URL
            : 'http://localhost:3000',
      credentials: true,
   })
);

const port = process.env.PORT || 5000;
const app = express();

app.use('/api/user', userRouter);

app.use(errorHandler);
app.listen(port, () => {
   console.log(`Server is running on port ${port}`);
   console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
   connectDB();
});
