import mongoose from 'mongoose';

const reviewImageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      default: 'Customer Transformation',
    },
    order: {
      type: Number,
      default: 0,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const ReviewImage = mongoose.model('ReviewImage', reviewImageSchema);
export default ReviewImage;

