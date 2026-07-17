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

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

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

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/stats', statsRoutes);

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
