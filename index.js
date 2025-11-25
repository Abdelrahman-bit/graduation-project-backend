import express from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import errorHandler from './middleware/errorHandler';

app.use(express.json());
app.use(helmet());
dotenv.config();
const port = process.env.PORT || 5000;
const app = express();

app.use(errorHandler);
app.listen(port, () => {
   console.log(`Server is running on port ${port}`);
});
