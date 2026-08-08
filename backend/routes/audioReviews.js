import express from 'express';
import mongoose from 'mongoose';
import AudioReview from '../models/AudioReview.js';
import { protect, admin } from '../middleware/auth.js';
import { getFallbackDb, saveFallbackDb } from '../utils/dbFallback.js';

const router = express.Router();

// @desc    Fetch all audio reviews
// @route   GET /api/audio-reviews
// @access  Public
router.get('/', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const reviews = await AudioReview.find({}).sort({ createdAt: -1 });
      res.json(reviews);
    } else {
      const db = getFallbackDb();
      res.json(db.audioReviews || []);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get single audio review
// @route   GET /api/audio-reviews/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const review = await AudioReview.findById(req.params.id);
      if (review) {
        res.json(review);
      } else {
        res.status(404).json({ message: 'Audio review not found' });
      }
    } else {
      const db = getFallbackDb();
      const review = (db.audioReviews || []).find(r => r._id === req.params.id);
      if (review) {
        res.json(review);
      } else {
        res.status(404).json({ message: 'Audio review not found' });
      }
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create audio review
// @route   POST /api/audio-reviews
// @access  Private/Admin
router.post('/', protect, admin, async (req, res) => {
  const { name, photo, audioUrl, duration, quote, location, rating, order } = req.body;

  try {
    if (!name || !audioUrl) {
      return res.status(400).json({ message: 'Customer name and audio file/URL are required' });
    }

    if (mongoose.connection.readyState === 1) {
      const review = new AudioReview({
        name,
        photo: photo || '/contact.webp',
        audioUrl,
        duration: duration || '0:45',
        quote: quote || '',
        location: location || 'Kerala',
        rating: rating !== undefined ? Number(rating) : 5,
        order: order !== undefined ? Number(order) : 0,
      });
      const createdReview = await review.save();
      res.status(201).json(createdReview);
    } else {
      const db = getFallbackDb();
      if (!db.audioReviews) db.audioReviews = [];
      const newReview = {
        _id: 'audiorev-' + Date.now(),
        name,
        photo: photo || '/contact.webp',
        audioUrl,
        duration: duration || '0:45',
        quote: quote || '',
        location: location || 'Kerala',
        rating: rating !== undefined ? Number(rating) : 5,
        order: order !== undefined ? Number(order) : 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.audioReviews.unshift(newReview);
      saveFallbackDb(db);
      res.status(201).json(newReview);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update audio review
// @route   PUT /api/audio-reviews/:id
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
  const { name, photo, audioUrl, duration, quote, location, rating, order } = req.body;

  try {
    if (mongoose.connection.readyState === 1) {
      const review = await AudioReview.findById(req.params.id);
      if (review) {
        review.name = name || review.name;
        if (photo !== undefined) review.photo = photo;
        review.audioUrl = audioUrl || review.audioUrl;
        if (duration !== undefined) review.duration = duration;
        if (quote !== undefined) review.quote = quote;
        if (location !== undefined) review.location = location;
        if (rating !== undefined) review.rating = Number(rating);
        if (order !== undefined) review.order = Number(order);

        const updatedReview = await review.save();
        res.json(updatedReview);
      } else {
        res.status(404).json({ message: 'Audio review not found' });
      }
    } else {
      const db = getFallbackDb();
      if (!db.audioReviews) db.audioReviews = [];
      const reviewIndex = db.audioReviews.findIndex(r => r._id === req.params.id);
      if (reviewIndex !== -1) {
        db.audioReviews[reviewIndex] = {
          ...db.audioReviews[reviewIndex],
          name: name || db.audioReviews[reviewIndex].name,
          photo: photo !== undefined ? photo : db.audioReviews[reviewIndex].photo,
          audioUrl: audioUrl || db.audioReviews[reviewIndex].audioUrl,
          duration: duration !== undefined ? duration : db.audioReviews[reviewIndex].duration,
          quote: quote !== undefined ? quote : db.audioReviews[reviewIndex].quote,
          location: location !== undefined ? location : db.audioReviews[reviewIndex].location,
          rating: rating !== undefined ? Number(rating) : db.audioReviews[reviewIndex].rating,
          order: order !== undefined ? Number(order) : db.audioReviews[reviewIndex].order,
          updatedAt: new Date().toISOString()
        };
        saveFallbackDb(db);
        res.json(db.audioReviews[reviewIndex]);
      } else {
        res.status(404).json({ message: 'Audio review not found' });
      }
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete audio review
// @route   DELETE /api/audio-reviews/:id
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const review = await AudioReview.findById(req.params.id);
      if (review) {
        await AudioReview.deleteOne({ _id: req.params.id });
        res.json({ message: 'Audio review removed' });
      } else {
        res.status(404).json({ message: 'Audio review not found' });
      }
    } else {
      const db = getFallbackDb();
      if (!db.audioReviews) db.audioReviews = [];
      const reviewIndex = db.audioReviews.findIndex(r => r._id === req.params.id);
      if (reviewIndex !== -1) {
        db.audioReviews.splice(reviewIndex, 1);
        saveFallbackDb(db);
        res.json({ message: 'Audio review removed' });
      } else {
        res.status(404).json({ message: 'Audio review not found' });
      }
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
