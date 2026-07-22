import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import { protect, admin } from '../middleware/auth.js';
import { getFallbackDb, saveFallbackDb } from '../utils/dbFallback.js';

const router = express.Router();

// @desc    Get dashboard stats
// @route   GET /api/stats
// @access  Private/Admin
router.get('/', protect, admin, async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const totalUsers = await User.countDocuments();
      const totalProducts = await Product.countDocuments();
      const totalOrders = await Order.countDocuments();

      const activeOrders = await Order.find({ status: { $nin: ['Cancelled'] } });
      const totalRevenue = activeOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);

      const pendingOrders = await Order.countDocuments({ status: 'Pending' });
      const confirmedOrders = await Order.countDocuments({ status: 'Confirmed' });
      const processingOrders = await Order.countDocuments({ status: 'Processing' });
      const shippedOrders = await Order.countDocuments({ status: 'Shipped' });
      const deliveredOrders = await Order.countDocuments({ status: 'Delivered' });
      const cancelledOrders = await Order.countDocuments({ status: 'Cancelled' });
      const contactedOrders = await Order.countDocuments({ status: 'Contacted' });
      const completedOrders = await Order.countDocuments({ status: 'Completed' });

      res.json({
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue,
        statusBreakdown: {
          pending: pendingOrders,
          confirmed: confirmedOrders,
          processing: processingOrders,
          shipped: shippedOrders,
          delivered: deliveredOrders,
          cancelled: cancelledOrders,
          contacted: contactedOrders,
          completed: completedOrders,
        },
      });
    } else {
      const db = getFallbackDb();
      const totalUsers = db.users.length;
      const totalProducts = db.products.length;
      const totalOrders = db.orders.length;

      const activeOrders = db.orders.filter(o => o.status !== 'Cancelled');
      const totalRevenue = activeOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);

      const pending = db.orders.filter(o => o.status === 'Pending').length;
      const confirmed = db.orders.filter(o => o.status === 'Confirmed').length;
      const processing = db.orders.filter(o => o.status === 'Processing').length;
      const shipped = db.orders.filter(o => o.status === 'Shipped').length;
      const delivered = db.orders.filter(o => o.status === 'Delivered').length;
      const cancelled = db.orders.filter(o => o.status === 'Cancelled').length;
      const contacted = db.orders.filter(o => o.status === 'Contacted').length;
      const completed = db.orders.filter(o => o.status === 'Completed').length;

      res.json({
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue,
        statusBreakdown: { pending, confirmed, processing, shipped, delivered, cancelled, contacted, completed },
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get list of all users
// @route   GET /api/stats/users
// @access  Private/Admin
router.get('/users', protect, admin, async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const users = await User.find({}).select('-password').sort({ createdAt: -1 });
      res.json(users);
    } else {
      const db = getFallbackDb();
      const usersWithoutPassword = db.users.map(({ password, ...rest }) => rest);
      res.json(usersWithoutPassword);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete a user
// @route   DELETE /api/stats/users/:id
// @access  Private/Admin
router.delete('/users/:id', protect, admin, async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const user = await User.findById(req.params.id);

      if (user) {
        if (user.isAdmin) {
          return res.status(400).json({ message: 'Cannot delete an administrator account' });
        }
        await User.deleteOne({ _id: req.params.id });
        res.json({ message: 'User deleted successfully' });
      } else {
        res.status(404).json({ message: 'User not found' });
      }
    } else {
      const db = getFallbackDb();
      const userIndex = db.users.findIndex(u => u._id === req.params.id);
      if (userIndex !== -1) {
        if (db.users[userIndex].isAdmin) {
          return res.status(400).json({ message: 'Cannot delete an administrator account' });
        }
        db.users.splice(userIndex, 1);
        saveFallbackDb(db);
        res.json({ message: 'User deleted successfully' });
      } else {
        res.status(404).json({ message: 'User not found' });
      }
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
