import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'session_secret_key_agadhi_churna_2026');

      // Get user from database (exclude password)
      if (mongoose.connection.readyState === 1) {
        req.user = await User.findById(decoded.id).select('-password');
      } else {
        const { getFallbackDb } = await import('../utils/dbFallback.js');
        const db = getFallbackDb();
        const found = db.users.find(u => u._id === decoded.id);
        if (found) {
          const { password, ...userWithoutPassword } = found;
          req.user = userWithoutPassword;
        }
      }

      if (!req.user) {
        res.status(401);
        throw new Error('Not authorized, user not found');
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      res.json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401);
    res.json({ message: 'Not authorized, no token' });
  }
};

export const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(403);
    res.json({ message: 'Not authorized as an admin' });
  }
};


