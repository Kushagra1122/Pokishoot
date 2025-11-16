const mongoose = require('mongoose');
require('./Pokemon'); // ensure Pokemon model is registered
require('./Match'); // ensure Match model is registered

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  passwordHash: {
    type: String,
    required: function() {
      // Only required if walletAddress is not set (traditional auth)
      return !this.walletAddress;
    },
    default: '',
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
      stats: {
        shootRange: { type: Number, default: null },
        shootPerMin: { type: Number, default: null },
        hitPoints: { type: Number, default: null },
        speed: { type: Number, default: null },
      },
      nftTokenId: {
        type: String,
        default: null,
        sparse: true,
      },
      nftTxHash: {
        type: String,
        default: null,
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
  walletAddress: {
    type: String,
    default: null,
    sparse: true, // Allow multiple null values
    index: true
  },
  walletType: {
    type: String,
    enum: ['evm', 'substrate', null],
    default: null
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
});

// Validation: Either passwordHash or walletAddress must be set
UserSchema.pre('validate', function(next) {
  if (!this.passwordHash && !this.walletAddress) {
    this.invalidate('passwordHash', 'Either password or wallet address is required');
    this.invalidate('walletAddress', 'Either password or wallet address is required');
  }
  next();
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
