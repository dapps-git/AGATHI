import express from 'express';
import crypto from 'crypto';
import mongoose from 'mongoose';
import Razorpay from 'razorpay';
import Product from '../models/Product.js';
import { getFallbackDb } from '../utils/dbFallback.js';

const router = express.Router();

const getRazorpayClient = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return null;
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
};

// @desc    Create a Razorpay order (amount calculated strictly on backend from product price * quantity)
// @route   POST /api/create-order
// @access  Public
router.post('/create-order', async (req, res) => {
  const { productId, quantity = 1, currency = 'INR', receipt } = req.body;

  const qty = Number(quantity);
  if (!productId || !Number.isInteger(qty) || qty < 1) {
    return res.status(400).json({
      message: 'Valid productId and quantity (>= 1) are required',
    });
  }

  let product = null;
  const isFallbackId = typeof productId === 'string' && productId.startsWith('prod-');

  if (mongoose.connection.readyState !== 1 || isFallbackId) {
    const db = getFallbackDb();
    product = db.products.find((p) => p._id === productId);
  } else {
    try {
      product = await Product.findById(productId);
    } catch {
      return res.status(404).json({ message: 'Product not found' });
    }
  }

  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  const amountInPaise = Math.round(Number(product.price) * qty * 100);
  if (!Number.isFinite(amountInPaise) || amountInPaise < 100) {
    return res.status(400).json({
      message: 'Amount must be at least 100 paise (₹1.00)',
    });
  }

  const razorpay = getRazorpayClient();
  if (!razorpay) {
    return res.status(401).json({
      message: 'Razorpay credentials are not configured',
    });
  }

  try {
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: String(currency || 'INR').toUpperCase(),
      receipt: receipt || `rcpt_${Date.now()}`,
    });

    return res.status(200).json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    const statusCode = error?.statusCode === 401 ? 401 : 500;
    const message =
      error?.error?.description ||
      error?.message ||
      'Failed to create Razorpay order';
    return res.status(statusCode).json({ message });
  }
});

// @desc    Verify Razorpay payment signature
// @route   POST /api/verify-payment
// @access  Public
router.post('/verify-payment', async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({
      success: false,
      message: 'Missing required payment verification fields',
    });
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return res.status(500).json({
      success: false,
      message: 'Razorpay secret key is not configured',
    });
  }

  const generatedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  const expectedBuffer = Buffer.from(generatedSignature, 'utf8');
  const receivedBuffer = Buffer.from(String(razorpay_signature), 'utf8');

  const isValid =
    expectedBuffer.length === receivedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, receivedBuffer);

  if (!isValid) {
    return res.status(400).json({
      success: false,
      message: 'Invalid payment signature',
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Payment verified successfully',
    razorpay_order_id,
    razorpay_payment_id,
  });
});

export default router;
