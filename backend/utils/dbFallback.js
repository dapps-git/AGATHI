import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import defaultAudioReviews from './defaultAudioReviews.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', 'database.json');

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

