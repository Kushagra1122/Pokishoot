const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Pokemon = require('../models/Pokemon');
const Match = require('../models/Match');
const Listing = require('../models/Listing');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/auth-demo';

async function clearDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n🗑️  Clearing database...');
    
    // Delete all collections
    const userCount = await User.countDocuments();
    const pokemonCount = await Pokemon.countDocuments();
    const matchCount = await Match.countDocuments();
    const listingCount = await Listing.countDocuments();

    console.log(`📊 Found:`);
    console.log(`   - Users: ${userCount}`);
    console.log(`   - Pokemon: ${pokemonCount}`);
    console.log(`   - Matches: ${matchCount}`);
    console.log(`   - Listings: ${listingCount}`);

    if (userCount > 0) {
      await User.deleteMany({});
      console.log('✅ Deleted all users');
    }

    if (matchCount > 0) {
      await Match.deleteMany({});
      console.log('✅ Deleted all matches');
    }

    if (listingCount > 0) {
      await Listing.deleteMany({});
      console.log('✅ Deleted all listings');
    }

    // Note: We're NOT deleting Pokemon - those are the base Pokemon data
    // Only delete if you want to reset Pokemon data too
    // if (pokemonCount > 0) {
    //   await Pokemon.deleteMany({});
    //   console.log('✅ Deleted all Pokemon');
    // }

    console.log('\n✨ Database cleared successfully!');
    console.log('📝 Note: Pokemon base data was preserved. If you want to clear that too, uncomment the Pokemon deletion code.');
    
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the script
clearDatabase();

