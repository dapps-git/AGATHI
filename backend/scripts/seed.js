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
      name: 'Agadhi Administrator',
      email: 'admin@agadhi.com',
      phone: '9999999999',
      password: 'Admin@123', // Will be hashed automatically by userSchema.pre('save') hook
      isAdmin: true,
    });
    console.log('Admin user seeded: admin@agadhi.com / Admin@123');

    // Create Regular test user
    const testUser = await User.create({
      name: 'John Doe',
      email: 'john@example.com',
      phone: '8888888888',
      password: 'user123',
      isAdmin: false,
    });
    console.log('Regular test user seeded: john@example.com / user123');

    // Create Products
    const products = [
      {
        name: 'Agadhi Choorna - Single Pack (125g)',
        price: 1550,
        description: 'Herbal Weight Gain Powder. Authentic Ayurvedic formulation packed with potent adaptogenic herbs. Designed to naturally boost appetite, improve digestion, and build healthy muscle mass safely without side-effects.',
        images: ['/images/product-pouch.jpg'],
        benefits: [
          '100% Ayurvedic & Side-Effect Free',
          'Naturally Boosts Appetite & Digestion',
          'Promotes Healthy Lean Muscle Mass',
          'Net Weight: 125g Pouch'
        ]
      },
      {
        name: 'Agadhi Choorna - Double Value Pack (2 x 125g)',
        price: 2900,
        description: 'Get two 125g pouches of Agadhi Choorna for a complete 30-day Ayurvedic course. Restores metabolic balance and helps you gain weight steadily and permanently.',
        images: ['/images/product-pouch-alt.jpg'],
        benefits: [
          'Best Value (Save ₹200)',
          'Complete 30-Day Supply',
          'Regulates Metabolism & Nutrient Absorption',
          'Free Shipping Included'
        ]
      }
    ];

    await Product.insertMany(products);
    console.log('Products seeded successfully!');

    console.log('Data Seeding Completed successfully!');
    process.exit();
  } catch (error) {
    console.error(`Error during seeding: ${error.message}`);
    process.exit(1);
  }
};

seedData();
