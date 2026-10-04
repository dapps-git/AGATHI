import express from 'express';
import mongoose from 'mongoose';
import AudioReview from '../models/AudioReview.js';
import defaultAudioReviews from '../utils/defaultAudioReviews.js';
import { protect, admin } from '../middleware/auth.js';
import { getFallbackDb, saveFallbackDb } from '../utils/dbFallback.js';

const router = express.Router();

// @desc    Fetch all audio reviews
// @route   GET /api/audio-reviews
// @access  Public
router.get('/', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      let reviews = await AudioReview.find({}).sort({ createdAt: -1 }).maxTimeMS(4000);
      if (reviews && reviews.length > 0) {
        return res.json(reviews);
      }
      if (!reviews || reviews.length === 0) {
        const reviewsToInsert = defaultAudioReviews.map(({ _id, ...rest }) => rest);
        reviews = await AudioReview.insertMany(reviewsToInsert);
        return res.json(reviews);
      }
    }
  } catch (error) {
    console.warn('MongoDB audioReviews query error, falling back to local DB:', error.message);
  }

  // Seamless fallback to database.json / defaultAudioReviews
  try {
    const db = getFallbackDb();
    const fallbackReviews = db.audioReviews && db.audioReviews.length > 0 ? db.audioReviews : defaultAudioReviews;
    return res.json(fallbackReviews || []);
  } catch (err) {
    return res.json(defaultAudioReviews || []);
  }
});

// @desc    Get single audio review
// @route   GET /api/audio-reviews/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const review = await AudioReview.findById(req.params.id).maxTimeMS(4000);
      if (review) {
        return res.json(review);
      }
    }
  } catch (error) {
    console.warn('MongoDB audioReviews findById error, falling back:', error.message);
  }

  const db = getFallbackDb();
  const review = (db.audioReviews || defaultAudioReviews || []).find(r => r._id === req.params.id);
  if (review) {
    return res.json(review);
  }
  res.status(404).json({ message: 'Audio review not found' });
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

    const reviewData = {
      name: name.trim(),
      photo: photo || '/contact.webp',
      audioUrl,
      duration: duration || '0:45',
      quote: quote || '',
      location: location || 'Kerala',
      rating: rating !== undefined ? Number(rating) : 5,
      order: order !== undefined ? Number(order) : 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    let createdReview = null;

    if (mongoose.connection.readyState === 1) {
      try {
        const review = new AudioReview(reviewData);
        createdReview = await review.save();
      } catch (mongoErr) {
        console.warn('MongoDB save failed, persisting to local fallback DB:', mongoErr.message);
      }
    }

    // Always persist to database.json fallback so newly added reviews never vanish on refresh
    const db = getFallbackDb();
    if (!db.audioReviews) db.audioReviews = [];
    const itemToStore = createdReview ? createdReview.toObject() : { _id: 'audiorev-' + Date.now(), ...reviewData };
    
    // Check if duplicate already exists
    const existingIndex = db.audioReviews.findIndex(r => r._id === itemToStore._id || r.audioUrl === itemToStore.audioUrl);
    if (existingIndex !== -1) {
      db.audioReviews[existingIndex] = itemToStore;
    } else {
      db.audioReviews.unshift(itemToStore);
    }
    saveFallbackDb(db);

    res.status(201).json(createdReview || itemToStore);
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
    let updatedReview = null;

    if (mongoose.connection.readyState === 1) {
      try {
        const review = await AudioReview.findById(req.params.id).maxTimeMS(4000);
        if (review) {
          if (name) review.name = name;
          if (photo !== undefined) review.photo = photo;
          if (audioUrl) review.audioUrl = audioUrl;
          if (duration !== undefined) review.duration = duration;
          if (quote !== undefined) review.quote = quote;
          if (location !== undefined) review.location = location;
          if (rating !== undefined) review.rating = Number(rating);
          if (order !== undefined) review.order = Number(order);

          updatedReview = await review.save();
        }
      } catch (mongoErr) {
        console.warn('MongoDB update failed, saving to local DB:', mongoErr.message);
      }
    }

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
      return res.json(updatedReview || db.audioReviews[reviewIndex]);
    }

    if (updatedReview) {
      return res.json(updatedReview);
    }

    res.status(404).json({ message: 'Audio review not found' });
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
      try {
        await AudioReview.deleteOne({ _id: req.params.id }).maxTimeMS(4000);
      } catch (mongoErr) {
        console.warn('MongoDB delete failed:', mongoErr.message);
      }
    }

    const db = getFallbackDb();
    if (!db.audioReviews) db.audioReviews = [];
    const reviewIndex = db.audioReviews.findIndex(r => r._id === req.params.id);
    if (reviewIndex !== -1) {
      db.audioReviews.splice(reviewIndex, 1);
      saveFallbackDb(db);
    }

    res.json({ message: 'Audio review removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
