import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

dotenv.config();

const updateAdmin = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/agadhichoornam';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    const newEmail = 'agadichoornam@gmail.com';
    const newPassword = 'agadiadmin@2026';

    // Check if there are any existing admins or user with newEmail / old emails
    const existingByEmail = await User.findOne({ email: newEmail });
    const existingOldAdmin = await User.findOne({ email: 'admin@agadi.com' });
    const anyAdmin = await User.findOne({ isAdmin: true });

    let targetAdmin = existingByEmail || existingOldAdmin || anyAdmin;

    if (targetAdmin) {
      targetAdmin.email = newEmail;
      targetAdmin.password = newPassword; // Pre-save hook will hash it
      targetAdmin.isAdmin = true;
      if (!targetAdmin.phone) targetAdmin.phone = '8139800282';
      await targetAdmin.save();
      console.log(`Admin user successfully updated: ${targetAdmin.email}`);
    } else {
      targetAdmin = await User.create({
        name: 'Agadi Administrator',
        email: newEmail,
        phone: '8139800282',
        password: newPassword,
        isAdmin: true,
      });
      console.log(`Admin user successfully created: ${targetAdmin.email}`);
    }

    // Clean up duplicate old admin accounts if any exist
    await User.deleteMany({ email: 'admin@agadi.com', _id: { $ne: targetAdmin._id } });

    // Verify password matching
    const verifiedUser = await User.findOne({ email: newEmail });
    const isMatch = await verifiedUser.matchPassword(newPassword);
    console.log('Password hash verification successful:', isMatch);
    console.log('Admin account details:', {
      _id: verifiedUser._id,
      email: verifiedUser.email,
      isAdmin: verifiedUser.isAdmin,
      passwordHashSample: verifiedUser.password.substring(0, 15) + '...',
    });

    await mongoose.disconnect();
    console.log('Database disconnected.');
    process.exit(0);
  } catch (error) {
    console.error('Error updating admin:', error);
    process.exit(1);
  }
};

updateAdmin();
