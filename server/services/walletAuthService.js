const siwe = require('siwe');
const { ethers } = require('ethers');
const { u8aToHex, hexToU8a } = require('@polkadot/util');
const { signatureVerify } = require('@polkadot/util-crypto');
const User = require('../models/User');

/**
 * Wallet-based Authentication Service
 * Implements Sign-In With Ethereum (SIWE) for Web3-native authentication
 */
class WalletAuthService {
  constructor() {
    this.domain = process.env.DOMAIN || 'localhost:4000';
    this.origin = process.env.ORIGIN || 'http://localhost:5173';
  }

  /**
   * Generate SIWE message for wallet signing
   * @param {string} address - Wallet address
   * @param {string} nonce - Random nonce
   * @returns {string} SIWE message
   */
  generateMessage(address, nonce) {
    // Convert address to proper checksum format (EIP-55)
    let checksumAddress = address;
    try {
      if (ethers.isAddress(address)) {
        checksumAddress = ethers.getAddress(address); // Converts to checksum
      }
    } catch (error) {
      console.warn('Invalid address format, using as-is:', address);
    }

    const siweMessage = new siwe.SiweMessage({
      domain: this.domain,
      address: checksumAddress,
      statement: 'Sign in to PokeWars',
      uri: this.origin,
      version: '1',
      chainId: 1287, // Moonbase Alpha
      nonce: nonce,
    });

    return siweMessage.prepareMessage();
  }

  /**
   * Verify SIWE signature (EVM) or Substrate signature
   * @param {string} message - Message to verify
   * @param {string} signature - Signature from wallet
   * @param {string} address - Wallet address
   * @param {string} walletType - 'evm' or 'substrate'
   * @returns {Promise<Object>} Verification result with address
   */
  async verifySignature(message, signature, address, walletType = 'evm') {
    try {
      if (walletType === 'substrate') {
        return this.verifySubstrateSignature(message, signature, address);
      } else {
        return this.verifyEVMSignature(message, signature);
      }
    } catch (error) {
      console.error('Signature verification error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Verify EVM (SIWE) signature
   * @param {string} message - SIWE message
   * @param {string} signature - Signature from wallet
   * @returns {Promise<Object>} Verification result
   */
  async verifyEVMSignature(message, signature) {
    try {
      const siweMessage = new siwe.SiweMessage(message);
      const fields = await siweMessage.verify({ signature });

      if (fields.success) {
        // Normalize address to lowercase for storage
        const normalizedAddress = fields.data.address.toLowerCase();
        return {
          success: true,
          address: normalizedAddress,
          expirationTime: fields.data.expirationTime,
        };
      }

      return { success: false, error: 'Verification failed' };
    } catch (error) {
      console.error('SIWE verification error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Verify Substrate signature
   * @param {string} message - Message that was signed
   * @param {string} signature - Signature in hex format
   * @param {string} address - Substrate address (SS58)
   * @returns {Object} Verification result
   */
  verifySubstrateSignature(message, signature, address) {
    try {
      // Convert message to bytes
      const messageBytes = new TextEncoder().encode(message);
      
      // Convert signature from hex to Uint8Array
      const signatureBytes = hexToU8a(signature);
      
      // Verify signature using Polkadot crypto
      const { isValid } = signatureVerify(messageBytes, signatureBytes, address);
      
      if (isValid) {
        // Normalize address for storage (keep SS58 format)
        return {
          success: true,
          address: address, // Substrate addresses are case-sensitive
        };
      }

      return { success: false, error: 'Substrate signature verification failed' };
    } catch (error) {
      console.error('Substrate signature verification error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate random nonce
   * @returns {string} Random nonce
   */
  generateNonce() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * Find or create user by wallet address
   * @param {string} address - Wallet address
   * @param {string} walletType - 'evm' or 'substrate'
   * @param {string} name - Optional name for new users
   * @returns {Promise<Object>} User object
   */
  async findOrCreateUser(address, walletType = 'evm', name = null) {
    try {
      // Normalize EVM addresses to lowercase, keep Substrate addresses as-is (case-sensitive)
      const normalizedAddress = walletType === 'substrate' ? address : address.toLowerCase();
      let user = await User.findOne({ walletAddress: normalizedAddress });

      if (!user) {
        // Generate default name if not provided
        let finalName = name;
        
        if (!finalName) {
          // Generate unique default name
          let attempts = 0;
          do {
            const defaultName = `Player_${address.slice(0, 8)}${attempts > 0 ? `_${attempts}` : ''}`;
            const existingUser = await User.findOne({ name: defaultName });
            if (!existingUser) {
              finalName = defaultName;
              break;
            }
            attempts++;
          } while (attempts < 100); // Prevent infinite loop
          
          if (!finalName) {
            // Fallback: use address with random suffix
            finalName = `Player_${Math.random().toString(36).substring(2, 10)}`;
          }
        } else {
          // Validate provided name
          const trimmedName = finalName.trim();
          if (trimmedName.length < 3 || trimmedName.length > 20) {
            throw new Error('Name must be between 3 and 20 characters');
          }
          if (!/^[a-zA-Z0-9_]+$/.test(trimmedName)) {
            throw new Error('Name can only contain letters, numbers, and underscores');
          }
          
          // Check if name is already taken
          const existingUser = await User.findOne({ name: trimmedName });
          if (existingUser) {
            throw new Error('Name already taken');
          }
          
          finalName = trimmedName;
        }

        // Create new user with wallet-based account
        user = new User({
          name: finalName,
          passwordHash: '', // No password for wallet-based accounts
          walletAddress: normalizedAddress,
          walletType: walletType,
        });

        await user.save();
        console.log(`✅ Created new wallet-based user: ${address} with name: ${finalName}`);
      } else {
        // Update wallet type if needed
        if (user.walletType !== walletType) {
          user.walletType = walletType;
          await user.save();
        }
      }

      return user;
    } catch (error) {
      console.error('Error finding/creating user:', error);
      throw error;
    }
  }

  /**
   * Generate JWT token for authenticated user
   * @param {Object} user - User object
   * @returns {string} JWT token
   */
  generateToken(user) {
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';
    
    return jwt.sign(
      { 
        id: user._id, 
        name: user.name,
        walletAddress: user.walletAddress,
        authType: 'wallet'
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
  }
}

// Export singleton instance
const walletAuthService = new WalletAuthService();
module.exports = walletAuthService;

