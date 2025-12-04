import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { faker } from '@faker-js/faker';
import userModel from '../models/usersModel.js';

dotenv.config({
   path: './config.env',
});
// Build Mongo connection string
const connectionString = process.env.MONGODB_URL.replace(
   '<USERNAME>',
   process.env.DB_USERNAME
).replace('<PASSWORD>', process.env.DB_PASSWORD);

export const seedUsers = async () => {
   try {
      await mongoose.connect(connectionString);
      console.log('✅ MongoDB Connected');

      // ✅ Clear old users
      await userModel.deleteMany();
      console.log('🗑 Old users removed');

      const users = [];

      // ✅ 10 INSTRUCTORS
      for (let i = 0; i < 10; i++) {
         users.push({
            name: faker.person.fullName(),
            username: `instructor_${i}_${faker.internet.username()}`,
            email: faker.internet.email().toLowerCase(),
            password: '1234567890',
            confirmPassword: '1234567890',
            role: 'instructor',
            phone: faker.phone.number(),
            avatar: faker.image.avatar(),
         });
      }

      // ✅ 5 STUDENTS
      for (let i = 0; i < 5; i++) {
         users.push({
            name: faker.person.fullName(),
            username: `student_${i}_${faker.internet.username()}`,
            email: faker.internet.email().toLowerCase(),
            password: '1234567890',
            confirmPassword: '1234567890',
            role: 'student',
            phone: faker.phone.number(),
            avatar: faker.image.avatar(),
         });
      }

      // ✅ Insert into DB
      await userModel.insertMany(users);

      console.log('✅ 10 Instructors + 5 Students Successfully Seeded!');
      process.exit();
   } catch (error) {
      console.error('❌ Seeding Error:', error);
      process.exit(1);
   }
};

// ✅ Run directly if called via node
seedUsers();
