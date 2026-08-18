import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';

const dbPath = path.resolve('database.json');

const defaultDb = {
  products: [],
  orders: [],
  audioReviews: [],
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
    if (!data.audioReviews) data.audioReviews = [];
    if (!data.users) data.users = defaultDb.users;
    return data;
  } catch (err) {
    return defaultDb;
  }
};

export const saveFallbackDb = (data) => {
  try {
    if (!data.audioReviews) data.audioReviews = [];
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Failed to save fallback DB:', err.message);
  }
};

export const isDbConnected = () => {
  return mongoose.connection.readyState === 1;
};
