const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('../models/Pokemon'); // register Pokemon for populate

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

exports.signup = async (req, res) => {
  try {
    const { name, password } = req.body;
    if (!name || !password)
      return res.status(400).json({ message: 'Name and password required' });

    const existing = await User.findOne({ name });
    if (existing)
      return res.status(409).json({ message: 'User already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({ name, passwordHash });

    await user.save();

    // Populate pokemon if any
    const userObj = await User.findById(user._id).populate('pokemon.pokemonId');

    const token = jwt.sign({ id: user._id, name: user.name }, JWT_SECRET, {
      expiresIn: '7d',
    });
    res.json({ token, user: userObj });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { name, password } = req.body;
    if (!name || !password)
      return res.status(400).json({ message: 'Name and password required' });

    const user = await User.findOne({ name });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, name: user.name }, JWT_SECRET, {
      expiresIn: '7d',
    });
    const userObj = await User.findById(user._id).populate('pokemon.pokemonId');
    res.json({ token, user: userObj });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.me = async (req, res) => {
  try {
    // Find user by ID, exclude password field, and populate Pokémon details
    const user = await User.findById(req.user.id)
      .select('-password') // exclude password
      .populate('pokemon.pokemonId') // populate Pokémon reference
      .populate('pokemon.level');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (err) {
    console.error('❌ Error in /me route:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
