import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';

const dbPath = path.resolve('database.json');

const defaultDb = {
  products: [
    {
      _id: "66723e7f4a56a6452ba3be7f",
      name: "Agadhi Choorna - Single Pack (125g)",
      price: 1550,
      description: "Herbal Weight Gain Powder. Authentic Ayurvedic formulation packed with potent adaptogenic herbs. Designed to naturally boost appetite, improve digestion, and build healthy muscle mass safely without side-effects.",
      images: ["/images/product-pouch.jpg"],
      benefits: ["100% Ayurvedic & Safe", "Naturally Boosts Appetite", "Promotes Healthy Weight Gain", "Net Weight: 125g Pouch"]
    },
    {
      _id: "66723e7f4a56a6452ba3be80",
      name: "Agadhi Choorna - Double Value Pack (2 x 125g)",
      price: 2900,
      description: "Get two 125g pouches of Agadhi Choorna for a complete 30-day course and save ₹200.",
      images: ["/images/product-pouch-alt.jpg"],
      benefits: ["Best Value (Save ₹200)", "Complete 30-Day Supply", "Regulates Metabolism", "Free Shipping Included"]
    }
  ],
  orders: [],
  users: [
    {
      _id: "66723e7f4a56a6452ba3be81",
      name: "Agadhi Administrator",
      email: "admin@agadhi.com",
      phone: "9999999999",
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
