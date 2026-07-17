import express from 'express';
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import { protect, admin } from '../middleware/auth.js';
import { getFallbackDb, saveFallbackDb } from '../utils/dbFallback.js';

const router = express.Router();

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
router.get('/', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      let products = await Product.find({}).sort({ createdAt: -1 });
      if (products.length === 0) {
        const db = getFallbackDb();
        if (db.products && db.products.length > 0) {
          const cleanProducts = db.products.map(p => {
            const { _id, ...rest } = p;
            return rest;
          });
          products = await Product.create(cleanProducts);
        }
      }
      res.json(products);
    } else {
      const db = getFallbackDb();
      res.json(db.products);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get a single product
// @route   GET /api/products/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const product = await Product.findById(req.params.id);
      if (product) {
        res.json(product);
      } else {
        res.status(404).json({ message: 'Product not found' });
      }
    } else {
      const db = getFallbackDb();
      const product = db.products.find(p => p._id === req.params.id);
      if (product) {
        res.json(product);
      } else {
        res.status(404).json({ message: 'Product not found' });
      }
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
router.post('/', protect, admin, async (req, res) => {
  const { name, price, description, images, benefits } = req.body;

  try {
    if (!name || !price || !description || !images || images.length === 0) {
      return res.status(400).json({ message: 'Name, price, description, and at least one image are required' });
    }

    if (mongoose.connection.readyState === 1) {
      const product = new Product({
        name,
        price,
        description,
        images,
        benefits: benefits || [],
      });
      const createdProduct = await product.save();
      res.status(201).json(createdProduct);
    } else {
      const db = getFallbackDb();
      const newProduct = {
        _id: 'prod-' + Date.now(),
        name,
        price: Number(price),
        description,
        images,
        benefits: benefits || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.products.push(newProduct);
      saveFallbackDb(db);
      res.status(201).json(newProduct);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
  const { name, price, description, images, benefits } = req.body;

  try {
    if (mongoose.connection.readyState === 1) {
      const product = await Product.findById(req.params.id);
      if (product) {
        product.name = name || product.name;
        product.price = price !== undefined ? price : product.price;
        product.description = description || product.description;
        product.images = images || product.images;
        product.benefits = benefits || product.benefits;

        const updatedProduct = await product.save();
        res.json(updatedProduct);
      } else {
        res.status(404).json({ message: 'Product not found' });
      }
    } else {
      const db = getFallbackDb();
      const productIndex = db.products.findIndex(p => p._id === req.params.id);
      if (productIndex !== -1) {
        db.products[productIndex] = {
          ...db.products[productIndex],
          name: name || db.products[productIndex].name,
          price: price !== undefined ? Number(price) : db.products[productIndex].price,
          description: description || db.products[productIndex].description,
          images: images || db.products[productIndex].images,
          benefits: benefits || db.products[productIndex].benefits,
          updatedAt: new Date().toISOString()
        };
        saveFallbackDb(db);
        res.json(db.products[productIndex]);
      } else {
        res.status(404).json({ message: 'Product not found' });
      }
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const product = await Product.findById(req.params.id);
      if (product) {
        await Product.deleteOne({ _id: req.params.id });
        res.json({ message: 'Product removed' });
      } else {
        res.status(404).json({ message: 'Product not found' });
      }
    } else {
      const db = getFallbackDb();
      const productIndex = db.products.findIndex(p => p._id === req.params.id);
      if (productIndex !== -1) {
        db.products.splice(productIndex, 1);
        saveFallbackDb(db);
        res.json({ message: 'Product removed' });
      } else {
        res.status(404).json({ message: 'Product not found' });
      }
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
