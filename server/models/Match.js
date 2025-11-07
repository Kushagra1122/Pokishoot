const mongoose = require('mongoose');

const PlayerPerformanceSchema = new mongoose.Schema({
  playerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  kills: {
    type: Number,
    default: 0
  },
  deaths: {
    type: Number,
    default: 0
  },
  assists: {
    type: Number,
    default: 0
  },
  damageDealt: {
    type: Number,
    default: 0
  },
  damageTaken: {
    type: Number,
    default: 0
  },
  score: {
    type: Number,
    default: 0
  },
  survivalTime: {
    type: Number,
    default: 0
  },
  accuracy: {
    type: Number,
    default: 0
  },
  pokemon: {
    pokemonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pokemon'
    },
    sprite: String,
    name: String
  }
});

const MatchSchema = new mongoose.Schema({
  gameCode: {
    type: String,
    required: true,
    unique: true
  },
  matchType: {
    type: String,
    enum: ['friendly', 'rated'],
    default: 'friendly'
  },
  gameSettings: {
    map: String,
    gameTime: Number,
    gameType: String,
    winCondition: String,
    killLimit: Number,
    scoreLimit: Number
  },
  players: [PlayerPerformanceSchema],
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  winnerName: String,
  duration: Number,
  startedAt: {
    type: Date,
    default: Date.now
  },
  endedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['completed', 'abandoned', 'cancelled'],
    default: 'completed'
  },
  stakingInfo: {
    totalStake: Number,
    stakeAmount: Number, // Individual stake amount per player
    matchId: {
      type: String, // Blockchain match ID (bytes32 as hex string)
      sparse: true // Only index when present
    },
    contractAddress: String, // MatchEscrow contract address
    stakes: [{
      playerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      walletAddress: String, // Player's wallet address
      amount: Number,
      transactionHash: String,
      deposited: {
        type: Boolean,
        default: false
      }
    }],
    createMatchTxHash: String, // Transaction hash when match was created
    joinMatchTxHash: String, // Transaction hash when playerB joined
    blockchainStatus: {
      type: String,
      default: 'pending',
      required: false, // Allow null/undefined for friendly matches
      // Custom validator - enum check without Mongoose enum (which rejects null)
      validate: {
        validator: function(value) {
          // If value is null or undefined, it's valid (for friendly matches)
          if (value === null || value === undefined) return true;
          // Otherwise, must be one of the valid enum values
          return ['pending', 'created', 'joined', 'settled', 'canceled'].includes(value);
        },
        message: 'blockchainStatus must be null/undefined or one of: pending, created, joined, settled, canceled'
      }
    }
  },
  blockchainResult: {
    txHash: String, // Transaction hash for result submission
    blockNumber: Number,
    serverNonce: Number,
    submittedAt: Date
  },
  finalRankings: [{
    rank: Number,
    id: mongoose.Schema.Types.ObjectId,
    name: String,
    kills: Number,
    deaths: Number,
    score: Number,
    kdRatio: Number
  }]
});

// Index for efficient queries
MatchSchema.index({ 'players.playerId': 1 });
MatchSchema.index({ 'startedAt': -1 });
MatchSchema.index({ 'matchType': 1, 'startedAt': -1 });
// Sparse unique index on stakingInfo.matchId (only indexes non-null values)
// This allows multiple friendly matches (with null matchId) without conflicts
MatchSchema.index({ 'stakingInfo.matchId': 1 }, { unique: true, sparse: true });

// Clean up references when converting to JSON
MatchSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Match', MatchSchema);

