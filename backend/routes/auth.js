import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Generate JWT token for regular users (7 days)
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'session_secret_key_agadhi_churna_2026', {
    expiresIn: '7d', // User session: 1 week
  });
};

// Generate JWT token for admin users (1 day)
const generateAdminToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'session_secret_key_agadhi_churna_2026', {
    expiresIn: '1d', // Admin session: 1 day
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
  const { name, email, phone, password, confirmPassword } = req.body;

  try {
    // Basic validation
    if (!name || !email || !phone || !password || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!name.trim() || name.trim().length < 2) {
      return res.status(400).json({ message: 'Name must be at least 2 characters long' });
    }

    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ message: 'Mobile number must contain exactly 10 digits' });
    }

    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d).{6,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long and contain both letters and numbers' });
    }

    // Fallback registration if mongoose is not connected
    if (mongoose.connection.readyState !== 1) {
      const { getFallbackDb, saveFallbackDb } = await import('../utils/dbFallback.js');
      const db = getFallbackDb();
      if (db.users.find(u => u.email === email)) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }
      if (db.users.find(u => u.phone === phone)) {
        return res.status(400).json({ message: 'User with this mobile number already exists' });
      }
      const newUser = {
        _id: 'user-' + Date.now(),
        name,
        email,
        phone,
        password,
        isAdmin: false,
        address: ''
      };
      db.users.push(newUser);
      saveFallbackDb(db);
      return res.status(201).json({
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        isAdmin: newUser.isAdmin,
        address: newUser.address,
        token: generateToken(newUser._id),
      });
    }

    // Check if user email exists
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Check if user phone exists
    const phoneExists = await User.findOne({ phone });
    if (phoneExists) {
      return res.status(400).json({ message: 'User with this mobile number already exists' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      phone,
      password,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isAdmin: user.isAdmin,
        address: user.address || '',
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Auto-seed admin user in Atlas if connected but empty
    if (mongoose.connection.readyState === 1) {
      const count = await User.countDocuments();
      if (count === 0) {
        await User.create({
          name: 'Agadi Administrator',
          email: 'admin@agadi.com',
          phone: '9072888825',
          password: 'Admin@123',
          isAdmin: true
        });
      }
    }

    // Fallback login if mongoose is not connected
    if (mongoose.connection.readyState !== 1) {
      const { getFallbackDb } = await import('../utils/dbFallback.js');
      const db = getFallbackDb();
      const user = db.users.find(u => u.email === email);
      if (user && user.password === password) {
        return res.json({
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          isAdmin: user.isAdmin,
          address: user.address || '',
          token: user.isAdmin ? generateAdminToken(user._id) : generateToken(user._id),
        });
      } else {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
    }

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isAdmin: user.isAdmin,
        address: user.address || '',
        token: user.isAdmin ? generateAdminToken(user._id) : generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Forgot Password - Reset password by verifying Email & Phone number
// @route   POST /api/auth/forgot-password
// @access  Public
router.post('/forgot-password', async (req, res) => {
  const { email, phone, password, confirmPassword } = req.body;

  try {
    if (!email || !phone || !password || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Fallback if mongoose is not connected
    if (mongoose.connection.readyState !== 1) {
      const { getFallbackDb, saveFallbackDb } = await import('../utils/dbFallback.js');
      const db = getFallbackDb();
      const userIndex = db.users.findIndex(u => u.email === email && u.phone === phone);
      
      if (userIndex === -1) {
        return res.status(404).json({ message: 'No user found matching this email and mobile number' });
      }

      db.users[userIndex].password = password;
      saveFallbackDb(db);
      return res.json({ message: 'Password reset successfully' });
    }

    // Real DB verification
    const user = await User.findOne({ email, phone });
    if (!user) {
      return res.status(404).json({ message: 'No user found matching this email and mobile number' });
    }

    // Update password (pre-save hook will hash it automatically)
    user.password = password;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isAdmin: user.isAdmin,
        address: user.address || '',
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
