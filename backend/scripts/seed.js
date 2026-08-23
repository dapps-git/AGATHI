import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import AudioReview from '../models/AudioReview.js';

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
    await AudioReview.deleteMany();
    console.log('Cleared existing database data...');

    // Create Admin User
    const admin = await User.create({
      name: 'Agadi Administrator',
      email: 'admin@agadi.com',
      phone: '8139800282',
      password: 'Admin@123',
      isAdmin: true,
    });
    console.log('Admin user seeded: admin@agadi.com / Admin@123');

    // Create Agadi Choorna Product
    const product = await Product.create({
      name: 'Agadi Choorna (Weight Gain Formula)',
      description: 'Pure 100% Ayurvedic herbal blend for natural weight gain, appetite stimulation, and gut health.',
      price: 1550,
      images: ['/images/product-pouch.webp'],
      benefits: [
        'Naturally Stimulates Appetite & Digestion',
        'Promotes Healthy Weight & Muscle Gain',
        '100% Herbal & Chemical Free Formula',
        'Improves Intestinal Nutrient Absorption'
      ],
    });
    console.log(`Product seeded: ${product.name} (₹${product.price})`);

    // Create Audio Reviews
    await AudioReview.insertMany([
      { name: 'Customer 1', photo: '/contact.webp', audioUrl: '/images/customer1.mp3', duration: '0:45', quote: 'Gained 5 kgs in 35 days!', location: 'Kerala', rating: 5, order: 1 },
      { name: 'Customer 2', photo: '/contact.webp', audioUrl: '/images/customer2.mp3', duration: '0:38', quote: 'Improved appetite & energy.', location: 'Kerala', rating: 5, order: 2 },
      { name: 'Customer 3', photo: '/contact.webp', audioUrl: '/images/customer3.mp3', duration: '0:51', quote: 'Natural & effective.', location: 'Kerala', rating: 5, order: 3 },
      { name: 'Customer 4', photo: '/contact.webp', audioUrl: '/images/customer4.mp3', duration: '0:42', quote: 'Gained 4 kgs cleanly.', location: 'Kerala', rating: 5, order: 4 }
    ]);
    console.log('Audio reviews seeded successfully!');

    console.log('Data Seeding Completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error(`Error during seeding: ${error.message}`);
    process.exit(1);
  }
};

seedData();
