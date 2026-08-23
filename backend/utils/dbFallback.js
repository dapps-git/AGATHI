import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', 'database.json');

const defaultAudioReviews = [
  {
    _id: 'audiorev-static-1',
    name: 'Customer 1',
    photo: '/contact.webp',
    audioUrl: '/images/customer1.mp3',
    duration: '0:45',
    quote: 'Gained 5 kgs in 35 days!',
    location: 'Kerala',
    rating: 5,
    order: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: 'audiorev-static-2',
    name: 'Customer 2',
    photo: '/contact.webp',
    audioUrl: '/images/customer2.mp3',
    duration: '0:38',
    quote: 'Improved appetite & energy.',
    location: 'Kerala',
    rating: 5,
    order: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: 'audiorev-static-3',
    name: 'Customer 3',
    photo: '/contact.webp',
    audioUrl: '/images/customer3.mp3',
    duration: '0:51',
    quote: 'Natural & effective.',
    location: 'Kerala',
    rating: 5,
    order: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: 'audiorev-static-4',
    name: 'Customer 4',
    photo: '/contact.webp',
    audioUrl: '/images/customer4.mp3',
    duration: '0:42',
    quote: 'Gained 4 kgs cleanly.',
    location: 'Kerala',
    rating: 5,
    order: 4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const defaultDb = {
  products: [],
  orders: [],
  audioReviews: defaultAudioReviews,
  users: [
    {
      _id: "66723e7f4a56a6452ba3be81",
      name: "Agadi Administrator",
      email: "admin@agadi.com",
      phone: "8139800282",
      password: "Admin@123",
      isAdmin: true
    }
  ]
};

export const getFallbackDb = () => {
  try {
    if (!fs.existsSync(dbPath)) {
      try {
        fs.writeFileSync(dbPath, JSON.stringify(defaultDb, null, 2));
      } catch (writeErr) {
        console.error('Fallback DB write error:', writeErr.message);
      }
      return defaultDb;
    }
    const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    let updated = false;
    if (!data.audioReviews || !Array.isArray(data.audioReviews) || data.audioReviews.length === 0) {
      data.audioReviews = defaultAudioReviews;
      updated = true;
    }
    if (!data.users || !Array.isArray(data.users) || data.users.length === 0) {
      data.users = defaultDb.users;
      updated = true;
    }
    if (updated) {
      saveFallbackDb(data);
    }
    return data;
  } catch (err) {
    return defaultDb;
  }
};

export const saveFallbackDb = (data) => {
  try {
    if (!data.audioReviews) data.audioReviews = defaultAudioReviews;
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Failed to save fallback DB:', err.message);
  }
};

export const isDbConnected = () => {
  return mongoose.connection.readyState === 1;
};

