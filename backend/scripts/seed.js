import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import AudioReview from '../models/AudioReview.js';
import defaultAudioReviews from '../utils/defaultAudioReviews.js';

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
      email: 'agadichoornam@gmail.com',
      phone: '8139800282',
      password: 'agadiadmin@2026',
      isAdmin: true,
    });
    console.log('Admin user seeded: agadichoornam@gmail.com / agadiadmin@2026');

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
    const reviewsToInsert = defaultAudioReviews.map(({ _id, ...rest }) => rest);
    await AudioReview.insertMany(reviewsToInsert);
    console.log('Audio reviews seeded successfully!');

    console.log('Data Seeding Completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error(`Error during seeding: ${error.message}`);
    process.exit(1);
  }
};

seedData();
