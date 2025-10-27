const mongoose = require('mongoose');
require('./Pokemon'); // ensure Pokemon model is registered
require('./Match'); // ensure Match model is registered

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  pokemon: [
    {
      pokemonId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pokemon',
        required: true,
      },
      level: {
        type: Number,
        default: 1,
        required: true,
      },
    },
  ],
  balance: {
    type: Number,
    default: 1.0,
    required: true,
  },
  experience: {
    type: Number,
    default: 0,
    required: true,
  },
  stats: {
    totalKills: {
      type: Number,
      default: 0
    },
    totalDeaths: {
      type: Number,
      default: 0
    },
    totalAssists: {
      type: Number,
      default: 0
    },
    matchesPlayed: {
      type: Number,
      default: 0
    },
    matchesWon: {
      type: Number,
      default: 0
    },
    totalDamageDealt: {
      type: Number,
      default: 0
    },
    totalDamageTaken: {
      type: Number,
      default: 0
    },
    accuracy: {
      type: Number,
      default: 0
    },
    averageSurvivalTime: {
      type: Number,
      default: 0
    }
  },
  ranking: {
    elo: {
      type: Number,
      default: 1000
    },
    tier: {
      type: String,
      enum: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master'],
      default: 'Bronze'
    },
    rank: {
      type: String,
      default: 'Unranked'
    }
  },
  matchHistory: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match'
  }],
  preferredPokemon: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pokemon'
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
});

// Remove sensitive fields when converting to JSON
UserSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    delete ret.passwordHash;
    return ret;
  },
});

module.exports = mongoose.model('User', UserSchema);
