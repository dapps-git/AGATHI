import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Optional if we allow checkout without login, or linked when logged in
    },
    name: {
      type: String,
      required: [true, 'Please add a name'],
    },
    phone: {
      type: String,
      required: [true, 'Please add a phone number'],
      match: [/^\d{10}$/, 'Phone number must contain exactly 10 digits'],
    },
    alternatePhone: {
      type: String,
      match: [/^\d{10}$/, 'Alternate phone number must contain exactly 10 digits'],
      required: false,
    },
    email: {
      type: String,
      required: [true, 'Please add an email address'],
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email'],
    },
    address: {
      type: String,
      required: [true, 'Please add a shipping address'],
    },
    landmark: {
      type: String,
      required: false,
    },
    district: {
      type: String,
      required: [true, 'Please select a district'],
    },
    state: {
      type: String,
      required: true,
      default: 'Kerala',
    },
    country: {
      type: String,
      required: true,
      default: 'India',
    },
    pinCode: {
      type: String,
      required: [true, 'Please add a PIN code'],
      match: [/^\d{6}$/, 'PIN code must contain exactly 6 digits'],
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Please add a product'],
    },
    quantity: {
      type: Number,
      required: true,
      default: 1,
      min: [1, 'Quantity must be at least 1'],
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    status: {
      type: String,
      required: true,
      enum: ['Pending', 'Contacted', 'Completed'],
      default: 'Pending',
    },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model('Order', orderSchema);

export default Order;
