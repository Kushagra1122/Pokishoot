const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/auth-demo';

async function fixMatchIndexes() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const matchesCollection = db.collection('matches');

    console.log('\n📋 Current indexes on matches collection:');
    const indexes = await matchesCollection.indexes();
    indexes.forEach(idx => {
      console.log(`   - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    console.log('\n🗑️  Dropping old incorrect indexes...');
    
    // Drop old top-level matchId index if it exists
    try {
      await matchesCollection.dropIndex('matchId_1');
      console.log('✅ Dropped old matchId_1 index');
    } catch (err) {
      if (err.code !== 27) { // 27 = IndexNotFound
        console.log('ℹ️  matchId_1 index not found or already dropped');
      } else {
        console.log('ℹ️  matchId_1 index does not exist');
      }
    }

    // Ensure sparse unique index on stakingInfo.matchId exists
    try {
      await matchesCollection.createIndex(
        { 'stakingInfo.matchId': 1 }, 
        { unique: true, sparse: true, name: 'stakingInfo.matchId_1' }
      );
      console.log('✅ Created/verified sparse unique index on stakingInfo.matchId');
    } catch (err) {
      if (err.code === 85) { // IndexOptionsConflict
        console.log('ℹ️  stakingInfo.matchId_1 index already exists with correct options');
      } else {
        console.log(`⚠️  Could not create index: ${err.message}`);
      }
    }

    console.log('\n📋 Updated indexes:');
    const updatedIndexes = await matchesCollection.indexes();
    updatedIndexes.forEach(idx => {
      console.log(`   - ${idx.name}: ${JSON.stringify(idx.key)} ${idx.unique ? '(unique)' : ''} ${idx.sparse ? '(sparse)' : ''}`);
    });

    console.log('\n✨ Match indexes fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing match indexes:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

if (require.main === module) {
  fixMatchIndexes();
}

module.exports = { fixMatchIndexes };




