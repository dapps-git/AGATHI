import mongoose from 'mongoose';

const audioReviewSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add customer name'],
      trim: true,
    },
    photo: {
      type: String,
      default: '/contact.webp',
    },
    audioUrl: {
      type: String,
      required: [true, 'Please provide an audio file or URL'],
    },
    duration: {
      type: String,
      default: '0:45',
    },
    quote: {
      type: String,
      default: '',
    },
    location: {
      type: String,
      default: 'Kerala',
    },
    rating: {
      type: Number,
      default: 5,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const AudioReview = mongoose.model('AudioReview', audioReviewSchema);

export default AudioReview;
