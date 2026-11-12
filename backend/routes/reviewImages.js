import express from 'express';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ReviewImage from '../models/ReviewImage.js';
import defaultReviewImages from '../utils/defaultReviewImages.js';
import { protect, admin } from '../middleware/auth.js';
import { getFallbackDb, saveFallbackDb } from '../utils/dbFallback.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

// Helper to determine where review files can be saved to disk
const getReviewUploadDir = () => {
  const candidates = [
    path.resolve(__dirname, '..', '..', 'frontend', 'public', 'review'),
    path.resolve(__dirname, '..', 'public', 'review'),
    path.resolve('frontend/public/review'),
    path.resolve('public/review')
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      return c;
    }
  }
  return null;
};

// Helper to save base64 data URL to webp file on disk if possible
const saveBase64Image = (dataUrl, prefix = 'PHOTO-ADMIN') => {
  if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
    return dataUrl;
  }

  const uploadDir = getReviewUploadDir();
  if (!uploadDir) {
    return dataUrl; // fallback to storing dataUrl directly
  }

  try {
    const matches = dataUrl.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
    if (!matches || matches.length < 3) return dataUrl;

    const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
    const base64Data = matches[2];
    const filename = `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}.${ext}`;
    const filePath = path.join(uploadDir, filename);

    fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
    return `/review/${filename}`;
  } catch (err) {
    console.warn('Could not write image to disk, falling back to data URL:', err.message);
    return dataUrl;
  }
};

// @desc    Get all review images
// @route   GET /api/review-images
// @access  Public
router.get('/', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      // Dynamic reviews (isDefault: false) first (newest createdAt first), then default reviews
      let reviews = await ReviewImage.find({}).sort({ isDefault: 1, createdAt: -1, order: 1 });
      if (reviews && reviews.length > 0) {
        return res.json(reviews);
      }
      if (!reviews || reviews.length === 0) {
        // Seed default images into MongoDB
        const toInsert = defaultReviewImages.map(({ _id, ...rest }) => rest);
        reviews = await ReviewImage.insertMany(toInsert);
        return res.json(reviews);
      }
    }
  } catch (error) {
    console.warn('MongoDB reviewImages query error, falling back to local DB:', error.message);
  }

  // Fallback to database.json
  try {
    const db = getFallbackDb();
    const fallbackReviews = db.reviewImages && db.reviewImages.length > 0 ? db.reviewImages : defaultReviewImages;
    return res.json(fallbackReviews || []);
  } catch (err) {
    return res.json(defaultReviewImages || []);
  }
});

// @desc    Upload review image(s) (supports single or bulk array)
// @route   POST /api/review-images
// @access  Private/Admin
router.post('/', protect, admin, async (req, res) => {
  try {
    const { images, url, title, order } = req.body;

    const itemsToProcess = [];
    if (Array.isArray(images) && images.length > 0) {
      images.forEach((img, idx) => {
        const rawUrl = typeof img === 'string' ? img : img.url;
        const imgTitle = (typeof img === 'object' && img.title) ? img.title : (title || `Customer Transformation ${Date.now()}-${idx + 1}`);
        if (rawUrl) {
          itemsToProcess.push({ url: rawUrl, title: imgTitle, order: idx });
        }
      });
    } else if (url) {
      itemsToProcess.push({ url, title: title || 'Customer Transformation', order: order !== undefined ? Number(order) : 0 });
    }

    if (itemsToProcess.length === 0) {
      return res.status(400).json({ message: 'No valid image data or URL provided' });
    }

    const createdItems = [];
    const db = getFallbackDb();
    if (!db.reviewImages) db.reviewImages = [...defaultReviewImages];

    for (let i = 0; i < itemsToProcess.length; i++) {
      const item = itemsToProcess[i];
      // Store the image data/url directly so it is 100% self-contained and never 404s across environments
      const processedUrl = item.url;

      const reviewData = {
        url: processedUrl,
        title: item.title,
        order: item.order !== undefined ? item.order : (i + 1),
        isDefault: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      let createdMongo = null;
      if (mongoose.connection.readyState === 1) {
        try {
          const doc = new ReviewImage(reviewData);
          createdMongo = await doc.save();
        } catch (mongoErr) {
          console.warn('MongoDB save error:', mongoErr.message);
        }
      }

      const itemToStore = createdMongo ? createdMongo.toObject() : { _id: 'revimg-dyn-' + Date.now() + '-' + i, ...reviewData };

      // Prepend to database.json so newest uploads are served first
      const existingIdx = db.reviewImages.findIndex(r => r._id === itemToStore._id || r.url === itemToStore.url);
      if (existingIdx !== -1) {
        db.reviewImages[existingIdx] = itemToStore;
      } else {
        db.reviewImages.unshift(itemToStore);
      }

      createdItems.push(itemToStore);
    }

    saveFallbackDb(db);

    return res.status(201).json({
      success: true,
      count: createdItems.length,
      data: createdItems.length === 1 ? createdItems[0] : createdItems
    });
  } catch (error) {
    console.error('Error creating review image:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete a review image
// @route   DELETE /api/review-images/:id
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
  const { id } = req.params;

  try {
    if (mongoose.connection.readyState === 1) {
      try {
        if (mongoose.Types.ObjectId.isValid(id)) {
          await ReviewImage.findByIdAndDelete(id);
        } else {
          await ReviewImage.deleteOne({ $or: [{ _id: id }, { url: id }, { url: `/review/${id}` }] });
        }
      } catch (mongoErr) {
        console.warn('MongoDB delete failed, continuing with fallback:', mongoErr.message);
      }
    }

    const db = getFallbackDb();
    if (db.reviewImages && Array.isArray(db.reviewImages)) {
      db.reviewImages = db.reviewImages.filter(r => r._id !== id && r.url !== id && r.url !== `/review/${id}`);
      saveFallbackDb(db);
    }

    res.json({ success: true, message: 'Review image removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

