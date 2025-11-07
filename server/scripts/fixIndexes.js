const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/auth-demo';

async function fixIndexes() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    console.log('\n📋 Current indexes:');
    const indexes = await usersCollection.indexes();
    indexes.forEach(idx => {
      console.log(`   - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    console.log('\n🗑️  Dropping old indexes...');
    
    // Drop accountName index if it exists
    try {
      await usersCollection.dropIndex('accountName_1');
      console.log('✅ Dropped accountName_1 index');
    } catch (err) {
      if (err.code !== 27) { // 27 = IndexNotFound
        console.log('ℹ️  accountName_1 index not found or already dropped');
      }
    }

    // Drop displayName index if it exists
    try {
      await usersCollection.dropIndex('displayName_1');
      console.log('✅ Dropped displayName_1 index');
    } catch (err) {
      if (err.code !== 27) {
        console.log('ℹ️  displayName_1 index not found or already dropped');
      }
    }

    // Ensure name_1 index exists (unique)
    try {
      await usersCollection.createIndex({ name: 1 }, { unique: true });
      console.log('✅ Created name_1 unique index');
    } catch (err) {
      if (err.code === 85) { // IndexOptionsConflict
        console.log('ℹ️  name_1 index already exists');
      } else {
        throw err;
      }
    }

    console.log('\n📋 Updated indexes:');
    const updatedIndexes = await usersCollection.indexes();
    updatedIndexes.forEach(idx => {
      console.log(`   - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    console.log('\n✨ Indexes fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing indexes:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the script
fixIndexes();

