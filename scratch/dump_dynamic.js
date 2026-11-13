const path = require('path');
const mongoose = require(path.join(__dirname, '../backend/node_modules/mongoose'));
const fs = require('fs');

const uri = 'mongodb://agaagadichoornam_db_user:w8l2g98bDwNqb8y2@ac-dywd1n9-shard-00-00.zq3bjyc.mongodb.net:27017,ac-dywd1n9-shard-00-01.zq3bjyc.mongodb.net:27017,ac-dywd1n9-shard-00-02.zq3bjyc.mongodb.net:27017/agadhichoornam?ssl=true&replicaSet=atlas-nj0u5g-shard-0&authSource=admin&retryWrites=true&w=majority';

async function dump() {
  await mongoose.connect(uri);
  const collection = mongoose.connection.collection('reviewimages');
  const items = await collection.find({ isDefault: false }).toArray();
  console.log('Found', items.length, 'non-default items');

  const outDir = path.join(__dirname, 'scratch', 'non_default');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  items.forEach((item, idx) => {
    console.log(`[${idx}] ID: ${item._id} Title: ${item.title}`);
    if (item.url && item.url.startsWith('data:image/')) {
      const base64 = item.url.split(',')[1];
      const buf = Buffer.from(base64, 'base64');
      fs.writeFileSync(path.join(outDir, `${idx}_${item._id}_${item.title.replace(/[^a-zA-Z0-9_-]/g, '')}.webp`), buf);
    }
  });

  await mongoose.disconnect();
}
dump().catch(console.error);
