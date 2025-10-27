const mongoose = require('mongoose');

const PokemonSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    required: true
  },
  baseStats: {
    shootRange: { type: Number, required: true },
    shootPerMin: { type: Number, required: true },
    hitPoints: { type: Number, required: true },
    speed: { type: Number, required: true }
  },
  sprite: { 
    type: String,
    required: true 
  },
  isFirstClaim: {
    type: Boolean,
    default: false
  },
  price: {
    type: Number,
    required: true,
    default: 0.5
  }
});

module.exports = mongoose.model('Pokemon', PokemonSchema);
