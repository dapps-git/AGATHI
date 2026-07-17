import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';

dotenv.config();

const seedData = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/agadhichoornam');
    console.log('Database connected for seeding...');

    // Clear existing data
    await User.deleteMany();
    await Product.deleteMany();
    await Order.deleteMany();
    console.log('Cleared existing database data...');

    // Create Admin User
    const adminSalt = await bcrypt.genSalt(10);
    const hashedAdminPassword = await bcrypt.hash('Admin@123', adminSalt);

    const admin = await User.create({
      name: 'Agadi Administrator',
      email: 'admin@agadhi.com',
      phone: '9072888821',
      password: 'Admin@123', // Will be hashed automatically by userSchema.pre('save') hook
      isAdmin: true,
    });
    console.log('Admin user seeded: admin@agadhi.com / Admin@123');




    console.log('Data Seeding Completed successfully!');
    process.exit();
  } catch (error) {
    console.error(`Error during seeding: ${error.message}`);
    process.exit(1);
  }
};

seedData();
