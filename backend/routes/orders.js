import express from 'express';
import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { protect, admin } from '../middleware/auth.js';
import { getFallbackDb, saveFallbackDb } from '../utils/dbFallback.js';

const router = express.Router();

// @desc    Create a new order
// @route   POST /api/orders
// @access  Public
router.post('/', async (req, res) => {
  const {
    user, // Optional
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

  try {
    // Validations
    if (!name || !phone || !email || !address || !district || !pinCode || !productId || !quantity) {
      return res.status(400).json({ message: 'Please fill all required fields' });
    }

    if (landmark && landmark.trim().length < 4) {
      return res.status(400).json({ message: 'Landmark must be at least 4 characters long' });
    }

    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    if (phone.length !== 10) {
      return res.status(400).json({ message: 'Phone number must contain exactly 10 digits' });
    }

    if (alternatePhone) {
      if (alternatePhone.length !== 10) {
        return res.status(400).json({ message: 'Alternate phone number must contain exactly 10 digits' });
      }
      if (phone === alternatePhone) {
        return res.status(400).json({ message: 'Alternate phone number cannot be the same as the primary phone number' });
      }
    }

    if (pinCode.length !== 6) {
      return res.status(400).json({ message: 'PIN code must contain exactly 6 digits' });
    }

    const ownerWhatsAppNumber = (process.env.WHATSAPP_PHONE || '918139800282').replace(/\+/g, '');

    // Fallback if mongoose is not connected
    if (mongoose.connection.readyState !== 1) {
      const db = getFallbackDb();
      const product = db.products.find(p => p._id === productId);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      const totalPrice = product.price * quantity;
      const newOrder = {
        _id: 'ord-' + Date.now(),
        user: user || null,
        name,
        phone,
        alternatePhone,
        email,
        address,
        landmark,
        district,
        state: state || 'Kerala',
        country: country || 'India',
        pinCode,
        product: {
          _id: product._id,
          name: product.name,
          price: product.price
        },
        quantity,
        totalPrice,
        status: 'Pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      db.orders.push(newOrder);

      // Update User address in fallback
      if (user) {
        const userIndex = db.users.findIndex(u => u._id === user);
        if (userIndex !== -1) {
          db.users[userIndex].address = [address, landmark, district, state || 'Kerala', pinCode].filter(Boolean).join(', ');
        }
      }

      saveFallbackDb(db);

      return res.status(201).json({
        success: true,
        order: newOrder,
        ownerWhatsAppNumber,
      });
    }

    // Check product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Calculate total price
    const totalPrice = product.price * quantity;

    // Create order
    const order = new Order({
      user: user || null,
      name,
      phone,
      alternatePhone,
      email,
      address,
      landmark,
      district,
      state: state || 'Kerala',
      country: country || 'India',
      pinCode,
      product: productId,
      quantity,
      totalPrice,
      status: 'Pending',
    });

    const createdOrder = await order.save();

    // Update User address in DB
    if (user) {
      const fullAddress = [address, landmark, district, state || 'Kerala', pinCode].filter(Boolean).join(', ');
      await User.findByIdAndUpdate(user, { address: fullAddress });
    }

    // Populate the product details to send back for the response (which helps in compositing WhatsApp message)
    const populatedOrder = await Order.findById(createdOrder._id).populate('product', 'name price');

    res.status(201).json({
      success: true,
      order: populatedOrder,
      ownerWhatsAppNumber,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
router.get('/', protect, admin, async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const orders = await Order.find({})
        .populate('product', 'name price')
        .populate('user', 'name email phone')
        .sort({ createdAt: -1 });

      res.json(orders);
    } else {
      const db = getFallbackDb();
      // Emulate populate and sort
      const populatedOrders = db.orders.map(order => {
        let orderUser = null;
        if (order.user) {
          const u = db.users.find(x => x._id === order.user);
          if (u) {
            orderUser = { _id: u._id, name: u.name, email: u.email, phone: u.phone };
          }
        }
        return {
          ...order,
          user: orderUser
        };
      }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      res.json(populatedOrders);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
router.put('/:id/status', protect, admin, async (req, res) => {
  const { status } = req.body;

  try {
    if (!status || !['Pending', 'Contacted', 'Completed', 'Cancelled', 'Checked', 'Shipped'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    if (mongoose.connection.readyState === 1) {
      const order = await Order.findById(req.params.id);

      if (order) {
        order.status = status;
        const updatedOrder = await order.save();

        const populatedOrder = await Order.findById(updatedOrder._id)
          .populate('product', 'name price')
          .populate('user', 'name email phone');

        res.json(populatedOrder);
      } else {
        res.status(404).json({ message: 'Order not found' });
      }
    } else {
      const db = getFallbackDb();
      const orderIndex = db.orders.findIndex(o => o._id === req.params.id);
      if (orderIndex !== -1) {
        db.orders[orderIndex].status = status;
        db.orders[orderIndex].updatedAt = new Date().toISOString();
        saveFallbackDb(db);

        // Emulate populate
        const order = db.orders[orderIndex];
        let orderUser = null;
        if (order.user) {
          const u = db.users.find(x => x._id === order.user);
          if (u) {
            orderUser = { _id: u._id, name: u.name, email: u.email, phone: u.phone };
          }
        }
        res.json({
          ...order,
          user: orderUser
        });
      } else {
        res.status(404).json({ message: 'Order not found' });
      }
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete an order
// @route   DELETE /api/orders/:id
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const order = await Order.findById(req.params.id);

      if (order) {
        await Order.deleteOne({ _id: req.params.id });
        res.json({ message: 'Order deleted successfully' });
      } else {
        res.status(404).json({ message: 'Order not found' });
      }
    } else {
      const db = getFallbackDb();
      const orderIndex = db.orders.findIndex(o => o._id === req.params.id);
      if (orderIndex !== -1) {
        db.orders.splice(orderIndex, 1);
        saveFallbackDb(db);
        res.json({ message: 'Order deleted successfully' });
      } else {
        res.status(404).json({ message: 'Order not found' });
      }
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
