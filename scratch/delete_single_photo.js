const path = require('path');
const mongoose = require(path.join(__dirname, '../backend/node_modules/mongoose'));

const uri = 'mongodb://agaagadichoornam_db_user:w8l2g98bDwNqb8y2@ac-dywd1n9-shard-00-00.zq3bjyc.mongodb.net:27017,ac-dywd1n9-shard-00-01.zq3bjyc.mongodb.net:27017,ac-dywd1n9-shard-00-02.zq3bjyc.mongodb.net:27017/agadhichoornam?ssl=true&replicaSet=atlas-nj0u5g-shard-0&authSource=admin&retryWrites=true&w=majority';

async function remove() {
  await mongoose.connect(uri);
  const collection = mongoose.connection.collection('reviewimages');
  
  const idToDelete = new mongoose.Types.ObjectId('6af57aecd99a2552afd0b003');
  const result = await collection.deleteOne({ _id: idToDelete });
  console.log('Deleted count:', result.deletedCount);

  // Also check if any duplicate with title 'WhatsApp Image 2026-11-11 at 6.28.24 PM (3)' exists
  const titleResult = await collection.deleteMany({ title: 'WhatsApp Image 2026-11-11 at 6.28.24 PM (3)' });
  console.log('Deleted by title count:', titleResult.deletedCount);

  const total = await collection.countDocuments();
  console.log('Remaining documents:', total);

  await mongoose.disconnect();
}

remove().catch(console.error);

