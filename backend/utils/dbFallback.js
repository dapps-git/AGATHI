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
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify(defaultDb, null, 2));
  }
  try {
    const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    if (!data.audioReviews) data.audioReviews = [];
    return data;
  } catch (err) {
    return defaultDb;
  }
};

export const saveFallbackDb = (data) => {
  if (!data.audioReviews) data.audioReviews = [];
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
};

export const isDbConnected = () => {
  return mongoose.connection.readyState === 1;
};
