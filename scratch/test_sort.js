const path = require('path');
const mongoose = require(path.join(__dirname, '../backend/node_modules/mongoose'));
const uri = 'mongodb://agaagadichoornam_db_user:w8l2g98bDwNqb8y2@ac-dywd1n9-shard-00-00.zq3bjyc.mongodb.net:27017,ac-dywd1n9-shard-00-01.zq3bjyc.mongodb.net:27017,ac-dywd1n9-shard-00-02.zq3bjyc.mongodb.net:27017/agadhichoornam?ssl=true&replicaSet=atlas-nj0u5g-shard-0&authSource=admin&retryWrites=true&w=majority';

async function test() {
  await mongoose.connect(uri);
  const collection = mongoose.connection.collection('reviewimages');
  const items = await collection.find({ isDefault: false }).sort({ createdAt: -1, order: 1 }).toArray();
  items.forEach((it, idx) => {
    console.log(idx + 1, it._id.toString(), it.title, it.createdAt);
  });
  await mongoose.disconnect();
}
test().catch(console.error);

