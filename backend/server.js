import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Route imports
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import statsRoutes from './routes/stats.js';
import audioReviewRoutes from './routes/audioReviews.js';

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Universal CORS & Preflight Middleware — Runs on every single request
app.use((req, res, next) => {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, token, x-access-token');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Middleware to strip subfolder prefix for cPanel deployments
app.use((req, res, next) => {
  try {
    const logMsg = `${new Date().toISOString()} - ${req.method} ${req.url} (originalUrl: ${req.originalUrl || ''})\n`;
    fs.appendFileSync(path.join(__dirname, 'request_log.txt'), logMsg);
  } catch (err) {
    // Ignore logging failures
  }

  if (req.url.startsWith('/agadi')) {
    req.url = req.url.replace(/^\/agadi/, '') || '/';
  }
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/audio-reviews', audioReviewRoutes);

// Base route
app.get('/', (req, res) => {
  res.send('Agadi Choorna API is running...');
});

// Global error handler
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
