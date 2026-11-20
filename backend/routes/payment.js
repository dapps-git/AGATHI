import express from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { getFallbackDb, saveFallbackDb } from '../utils/dbFallback.js';

const router = express.Router();

// Lazily initialise Razorpay instance so the server starts even if keys are
// not yet set (useful during local dev before .env is populated).
const getRazorpay = () => {
  const keyId = process.env.RAZORPAY_KEY_ID || '';
  const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
  if (!keyId || !keySecret || keyId.startsWith('REPLACE')) {
    throw new Error('Razorpay keys are not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env');
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payment/create-order
// Creates a Razorpay order and returns the order_id + key_id to the frontend.
// Body: { amount (₹), currency?, receipt? }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/create-order', async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt } = req.body;
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const razorpay = getRazorpay();
    const options = {
      amount: Math.round(Number(amount) * 100), // paise
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
    };

    const razorpayOrder = await razorpay.orders.create(options);

    res.json({
      success: true,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('Razorpay create-order error:', err);
    res.status(500).json({ message: err.message || 'Failed to create payment order' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payment/verify
// Verifies Razorpay signature, then saves the order to MongoDB.
// Body: all order fields + razorpayOrderId, razorpayPaymentId, razorpaySignature
// ─────────────────────────────────────────────────────────────────────────────
router.post('/verify', async (req, res) => {
  const {
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    // Order fields
    user,
    name,
    phone,
    alternatePhone,
    email,
    address,
    landmark,
    district,
    state,
    country,
    pinCode,
    productId,
    quantity,
  } = req.body;

  // 1. Verify signature
  try {
    const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      return res.status(400).json({ message: 'Payment verification failed — invalid signature.' });
    }
  } catch (err) {
    return res.status(500).json({ message: 'Signature verification error: ' + err.message });
  }

  // 2. Save order to DB
  try {
    if (mongoose.connection.readyState !== 1) {
      // Fallback DB
      const db = getFallbackDb();
      const product = db.products.find(p => p._id === productId);
      if (!product) return res.status(404).json({ message: 'Product not found' });

      const totalPrice = product.price * quantity;
      const newOrder = {
        _id: 'ord-' + Date.now(),
        user: user || null,
        name, phone, alternatePhone, email, address, landmark,
        district, state: state || 'Kerala', country: country || 'India', pinCode,
        product: { _id: product._id, name: product.name, price: product.price },
        quantity, totalPrice,
        status: 'Confirmed',
        paymentMethod: 'Razorpay',
        paymentStatus: 'Paid',
        razorpayOrderId, razorpayPaymentId, razorpaySignature,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.orders.push(newOrder);
      if (user) {
        const idx = db.users.findIndex(u => u._id === user);
        if (idx !== -1) {
          db.users[idx].address = [address, landmark, district, state || 'Kerala', pinCode].filter(Boolean).join(', ');
        }
      }
      saveFallbackDb(db);
      return res.status(201).json({ success: true, order: newOrder });
    }

    // MongoDB
    let product;
    try {
      product = await Product.findById(productId);
    } catch {
      return res.status(404).json({ message: 'Product not found' });
    }
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const totalPrice = product.price * quantity;
    const order = new Order({
      user: user || null,
      name, phone, alternatePhone, email, address, landmark,
      district, state: state || 'Kerala', country: country || 'India', pinCode,
      product: productId,
      quantity, totalPrice,
      status: 'Confirmed',
      paymentMethod: 'Razorpay',
      paymentStatus: 'Paid',
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    const created = await order.save();

    if (user) {
      const fullAddress = [address, landmark, district, state || 'Kerala', pinCode].filter(Boolean).join(', ');
      await User.findByIdAndUpdate(user, { address: fullAddress });
    }

    const populated = await Order.findById(created._id).populate('product', 'name price');
    return res.status(201).json({ success: true, order: populated });
  } catch (err) {
    console.error('Order save error after payment:', err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
