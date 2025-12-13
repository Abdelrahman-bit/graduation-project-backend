import dotenv from 'dotenv';
// configuration env File for Secret Data
import { createServer } from 'http';
import app from './app.js';
import mongoose from 'mongoose';

dotenv.config({
   path: './config.env',
});

// Build Mongo connection string
const connectionString = process.env.MONGODB_URL.replace(
   '<USERNAME>',
   process.env.DB_USERNAME
).replace('<PASSWORD>', process.env.DB_PASSWORD);

const connectDB = async () => {
   try {
      const connection = await mongoose.connect(connectionString);
      console.log(`MongoDB connected: ${connection.connection.host}`);
   } catch (error) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
   }
};

// Database Initialization
connectDB();

// connecting to the Server
const port = process.env.PORT || 5000;

// Create HTTP server (no longer using Socket.IO - using Ably for real-time)
const httpServer = createServer(app);

const server = httpServer.listen(port, () => {
   console.log('Server is up & running on port ' + port);
   console.log('Real-time features powered by Ably');
});

// close the server gracefully (give the server time to finish all the currently pending tasks before ending )
process.on('unhandledRejection', (err) => {
   console.log(err.name, err.message);
   server.close(() => {
      process.exit(1);
   });
});
