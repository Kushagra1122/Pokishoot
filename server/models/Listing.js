const mongoose = require('mongoose');
require('./Pokemon');
require('./User');

const ListingSchema = new mongoose.Schema({
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  pokemon: {
    pokemonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pokemon',
      required: true,
    },
    level: {
      type: Number,
      default: 1,
    },
  },
  price: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'sold', 'cancelled'],
    default: 'active',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  soldTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  transactionHash: {
    type: String,
    default: null,
    sparse: true,
    index: true,
  },
  blockNumber: {
    type: Number,
    default: null,
  },
});

module.exports = mongoose.model('Listing', ListingSchema);
