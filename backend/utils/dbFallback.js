import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';

const dbPath = path.resolve('database.json');

const defaultDb = {
  products: [],
  orders: [],
  users: [
    {
      _id: "66723e7f4a56a6452ba3be81",
      name: "Agadi Administrator",
      email: "admin@agadi.com",
      phone: "9072888821",
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
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  } catch (err) {
    return defaultDb;
  }
};

export const saveFallbackDb = (data) => {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
};

export const isDbConnected = () => {
  return mongoose.connection.readyState === 1;
};
