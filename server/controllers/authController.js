const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const walletAuthService = require('../services/walletAuthService');
require('../models/Pokemon'); // register Pokemon for populate

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

// Store nonces temporarily (in production, use Redis)
const nonceStore = new Map();

exports.signup = async (req, res) => {
  try {
    const { name, password } = req.body;
    
    if (!name || !password)
      return res.status(400).json({ message: 'Name and password required' });

    const existing = await User.findOne({ name: name.trim() });
    if (existing)
      return res.status(409).json({ message: 'User already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({ 
      name: name.trim(),
      passwordHash 
    });

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

    const user = await User.findOne({ name: name.trim() });
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

// PUT /api/auth/profile
// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }

    // Check if name is already taken by another user
    const existingUser = await User.findOne({ 
      name: name.trim(),
      _id: { $ne: userId }
    });

    if (existingUser) {
      return res.status(409).json({ message: 'Username already taken' });
    }

    // Update user's name
    const user = await User.findByIdAndUpdate(
      userId,
      { name: name.trim() },
      { new: true }
    ).populate('pokemon.pokemonId');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      message: 'Profile updated successfully',
      user 
    });
  } catch (err) {
    console.error('❌ Error updating profile:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/auth/link-wallet
// Link a wallet address to user account
exports.linkWallet = async (req, res) => {
  try {
    const userId = req.user.id;
    const { walletAddress, walletType } = req.body;

    if (!walletAddress || !walletType) {
      return res.status(400).json({ message: 'walletAddress and walletType are required' });
    }

    if (!['evm', 'substrate'].includes(walletType)) {
      return res.status(400).json({ message: 'walletType must be "evm" or "substrate"' });
    }

    // Validate address format based on wallet type
    if (walletType === 'evm') {
      if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
        return res.status(400).json({ message: 'Invalid EVM wallet address format' });
      }
    } else if (walletType === 'substrate') {
      // Substrate addresses are SS58 format, typically 32-48 characters
      if (walletAddress.length < 32 || walletAddress.length > 48) {
        return res.status(400).json({ message: 'Invalid Substrate wallet address format' });
      }
    }

    // Check if wallet is already linked to another account
    const existingUser = await User.findOne({ 
      walletAddress,
      _id: { $ne: userId } // Exclude current user
    });

    if (existingUser) {
      return res.status(409).json({ message: 'This wallet is already linked to another account' });
    }

    // Update user's wallet address
    const user = await User.findByIdAndUpdate(
      userId,
      { 
        walletAddress,
        walletType
      },
      { new: true }
    ).populate('pokemon.pokemonId');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      message: 'Wallet linked successfully',
      user 
    });
  } catch (err) {
    console.error('❌ Error linking wallet:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/auth/wallet/nonce
// Get nonce for wallet authentication
exports.getWalletNonce = async (req, res) => {
  try {
    const { address, walletType = 'evm' } = req.body;
    
    if (!address) {
      return res.status(400).json({ message: 'Wallet address required' });
    }

    if (!['evm', 'substrate'].includes(walletType)) {
      return res.status(400).json({ message: 'walletType must be "evm" or "substrate"' });
    }

    const nonce = walletAuthService.generateNonce();
    
    // Store nonce with address (normalize EVM, keep Substrate as-is)
    let normalizedAddress = address;
    if (walletType === 'evm') {
      const { ethers } = require('ethers');
      if (!ethers.isAddress(address)) {
        return res.status(400).json({ message: 'Invalid EVM wallet address format' });
      }
      normalizedAddress = address.toLowerCase();
    } else {
      // Substrate addresses are SS58 format, validate basic structure
      if (address.length < 32 || address.length > 48) {
        return res.status(400).json({ message: 'Invalid Substrate wallet address format' });
      }
    }

    nonceStore.set(normalizedAddress, {
      nonce,
      timestamp: Date.now(),
      walletType,
    });

    // Clean up old nonces (older than 5 minutes)
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    for (const [addr, data] of nonceStore.entries()) {
      if (data.timestamp < fiveMinutesAgo) {
        nonceStore.delete(addr);
      }
    }

    // Generate message based on wallet type
    let message;
    if (walletType === 'evm') {
      const { ethers } = require('ethers');
      const checksumAddress = ethers.getAddress(address);
      message = walletAuthService.generateMessage(checksumAddress, nonce);
    } else {
      // For Substrate, use a simple message format
      message = `Sign in to PokeWars\n\nAddress: ${address}\nNonce: ${nonce}\nDomain: ${walletAuthService.domain}`;
    }

    res.json({ nonce, message });
  } catch (err) {
    console.error('Get wallet nonce error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST /api/auth/wallet/verify
// Verify wallet signature
exports.verifyWalletSignature = async (req, res) => {
  try {
    const { message, signature, walletType = 'evm', address } = req.body;

    if (!message || !signature) {
      return res.status(400).json({ message: 'Message and signature required' });
    }

    // For Substrate, address is required
    if (walletType === 'substrate' && !address) {
      return res.status(400).json({ message: 'Address required for Substrate verification' });
    }

    const verification = await walletAuthService.verifySignature(message, signature, address, walletType);

    if (!verification.success) {
      return res.status(401).json({ message: 'Invalid signature', error: verification.error });
    }

    // Find or create user
    const user = await walletAuthService.findOrCreateUser(verification.address, walletType);
    const populatedUser = await User.findById(user._id).populate('pokemon.pokemonId');

    // Generate token
    const token = walletAuthService.generateToken(user);

    res.json({
      success: true,
      token,
      user: populatedUser,
      address: verification.address,
    });
  } catch (err) {
    console.error('Verify wallet signature error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/auth/wallet/login
// Complete wallet login flow
exports.walletLogin = async (req, res) => {
  try {
    const { message, signature, walletType = 'evm', name } = req.body;

    if (!message || !signature) {
      return res.status(400).json({ message: 'Message and signature required' });
    }

    // Validate wallet type
    if (walletType && !['evm', 'substrate'].includes(walletType)) {
      return res.status(400).json({ message: 'Invalid wallet type' });
    }

    // Validate name if provided
    if (name) {
      const trimmedName = name.trim();
      if (trimmedName.length < 3 || trimmedName.length > 20) {
        return res.status(400).json({ message: 'Name must be between 3 and 20 characters' });
      }
      if (!/^[a-zA-Z0-9_]+$/.test(trimmedName)) {
        return res.status(400).json({ message: 'Name can only contain letters, numbers, and underscores' });
      }
    }

    // Extract address from message for Substrate, or verify via SIWE for EVM
    let address;
    if (walletType === 'substrate') {
      // For Substrate, address should be in the request body or extracted from message
      address = req.body.address;
      if (!address) {
        // Try to extract from message
        const addressMatch = message.match(/Address:\s*([^\n]+)/);
        if (addressMatch) {
          address = addressMatch[1].trim();
        }
      }
      if (!address) {
        return res.status(400).json({ message: 'Address required for Substrate verification' });
      }
    }

    const verification = await walletAuthService.verifySignature(message, signature, address, walletType);

    if (!verification.success) {
      return res.status(401).json({ 
        message: 'Invalid signature',
        error: verification.error 
      });
    }

    // Find or create user (with optional name)
    const user = await walletAuthService.findOrCreateUser(
      verification.address, 
      walletType, 
      name ? name.trim() : null
    );
    const populatedUser = await User.findById(user._id).populate('pokemon.pokemonId');

    // Generate token
    const token = walletAuthService.generateToken(user);

    res.json({
      token,
      user: populatedUser,
      authType: 'wallet',
      needsName: !user.name || user.name.startsWith('Player_'), // Indicate if user needs to set a name
    });
  } catch (err) {
    console.error('Wallet login error:', err);
    
    // Handle specific errors
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Name already taken' });
    }
    
    res.status(500).json({ 
      message: 'Server error',
      ...(process.env.NODE_ENV === 'development' && { error: err.message })
    });
  }
};

// PUT /api/auth/wallet/set-name
// Set or update user name after wallet login
exports.setWalletUserName = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const trimmedName = name.trim();

    // Validate name length
    if (trimmedName.length < 3 || trimmedName.length > 20) {
      return res.status(400).json({ message: 'Name must be between 3 and 20 characters' });
    }

    // Validate name format (alphanumeric and underscores only)
    if (!/^[a-zA-Z0-9_]+$/.test(trimmedName)) {
      return res.status(400).json({ 
        message: 'Name can only contain letters, numbers, and underscores' 
      });
    }

    // Check if name is already taken by another user
    const existingUser = await User.findOne({ 
      name: trimmedName,
      _id: { $ne: userId }
    });

    if (existingUser) {
      return res.status(409).json({ message: 'Name already taken' });
    }

    // Update user's name
    const user = await User.findByIdAndUpdate(
      userId,
      { name: trimmedName },
      { new: true, runValidators: true }
    ).populate('pokemon.pokemonId');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      message: 'Name updated successfully',
      user 
    });
  } catch (err) {
    console.error('Set wallet user name error:', err);
    
    // Handle duplicate key error
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Name already taken' });
    }
    
    res.status(500).json({ 
      message: 'Server error',
      ...(process.env.NODE_ENV === 'development' && { error: err.message })
    });
  }
};
