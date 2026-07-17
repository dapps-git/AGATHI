import 'dotenv/config';
import mongoose from 'mongoose';
import Product from '../models/Product.js';

async function updatePrices() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Update all products with old prices to the correct ₹1550 price
    // First list all products
    const products = await Product.find({});
    console.log('Current products:', products.map(p => ({ name: p.name, price: p.price, id: p._id })));

    // Update "Single Pack (125g)" to 1550 if it's wrong
    const updated = await Product.updateMany(
      { price: { $lt: 1000 } }, // catches old 350 price
      { $set: { price: 1550, name: 'Agadhi Choorna - Single Pack (125g)' } }
    );
    console.log('Updated old low-price products:', updated.modifiedCount);

    // Update "Premium Weight Gain (500g)" to correct product if exists
    await Product.updateMany(
      { name: { $regex: '500g' } },
      { $set: { price: 1550, name: 'Agadhi Choorna - Single Pack (125g)' } }
    );

    // Ensure at least one product has correct price
    const count = await Product.countDocuments({ price: 1550 });
    if (count === 0) {
      await Product.updateMany({}, { $set: { price: 1550 } });
      console.log('Force-set all products to 1550');
    }

    const finalProducts = await Product.find({});
    console.log('Final products:', finalProducts.map(p => ({ name: p.name, price: p.price })));

    await mongoose.disconnect();
    console.log('Done!');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

updatePrices();
