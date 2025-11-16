/**
 * Input validation middleware
 * Validates request body, params, and query
 */

const { ethers } = require('ethers');

/**
 * Validate wallet address format (EVM or Substrate)
 */
function validateWalletAddress(address, walletType = 'evm') {
  if (!address || typeof address !== 'string') {
    return false;
  }
  
  if (walletType === 'substrate') {
    // Substrate addresses are SS58 format, typically 32-48 characters
    // They can start with various characters (1, 5, C, D, E, F, G, H, J, K, L, M, N, P, Q, R, S, T, U, V, W, X, Y, Z)
    return address.length >= 32 && address.length <= 48;
  }
  
  // EVM addresses
  return ethers.isAddress(address);
}

/**
 * Validate MongoDB ObjectId format
 */
function validateObjectId(id) {
  if (!id || typeof id !== 'string') {
    return false;
  }
  return /^[0-9a-fA-F]{24}$/.test(id);
}

/**
 * Sanitize string input
 */
function sanitizeString(str, maxLength = 1000) {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, maxLength);
}

/**
 * Validate and sanitize request body
 */
function validateBody(schema) {
  return (req, res, next) => {
    try {
      const errors = [];

      for (const [field, rules] of Object.entries(schema)) {
        const value = req.body[field];

        // Check required fields
        if (rules.required && (value === undefined || value === null || value === '')) {
          errors.push(`${field} is required`);
          continue;
        }

        // Skip validation if field is optional and not provided
        if (!rules.required && (value === undefined || value === null || value === '')) {
          continue;
        }

        // Type validation
        if (rules.type && typeof value !== rules.type) {
          errors.push(`${field} must be of type ${rules.type}`);
          continue;
        }

        // String validations
        if (rules.type === 'string') {
          const sanitized = sanitizeString(value, rules.maxLength);
          req.body[field] = sanitized;

          if (rules.minLength && sanitized.length < rules.minLength) {
            errors.push(`${field} must be at least ${rules.minLength} characters`);
          }
          if (rules.maxLength && sanitized.length > rules.maxLength) {
            errors.push(`${field} must be at most ${rules.maxLength} characters`);
          }
          if (rules.pattern && !rules.pattern.test(sanitized)) {
            errors.push(`${field} format is invalid`);
          }
        }

        // Number validations
        if (rules.type === 'number') {
          const num = Number(value);
          if (isNaN(num)) {
            errors.push(`${field} must be a valid number`);
            continue;
          }
          req.body[field] = num;

          if (rules.min !== undefined && num < rules.min) {
            errors.push(`${field} must be at least ${rules.min}`);
          }
          if (rules.max !== undefined && num > rules.max) {
            errors.push(`${field} must be at most ${rules.max}`);
          }
        }

        // Custom validators
        if (rules.validator) {
          // Pass req.body as context for validators that need other fields
          const isValid = typeof rules.validator === 'function' 
            ? rules.validator(value, req.body)
            : rules.validator(value);
          if (!isValid) {
            errors.push(rules.message || `${field} is invalid`);
          }
        }
      }

      if (errors.length > 0) {
        return res.status(400).json({ 
          message: 'Validation failed', 
          errors 
        });
      }

      next();
    } catch (error) {
      console.error('Validation error:', error);
      res.status(500).json({ message: 'Validation error' });
    }
  };
}

/**
 * Common validation schemas
 */
const schemas = {
  walletAddress: {
    address: {
      required: true,
      type: 'string',
      validator: (value, body) => {
        // Get walletType from request body (default to 'evm')
        const walletType = body?.walletType || 'evm';
        return validateWalletAddress(value, walletType);
      },
      message: 'Invalid wallet address format'
    },
    walletType: {
      required: false,
      type: 'string',
      validator: (v) => !v || ['evm', 'substrate'].includes(v),
      message: 'walletType must be evm or substrate'
    }
  },
  walletLogin: {
    message: { required: true, type: 'string', minLength: 10 },
    signature: { required: true, type: 'string', minLength: 10 },
    walletType: { 
      required: false, 
      type: 'string',
      validator: (v) => ['evm', 'substrate'].includes(v),
      message: 'walletType must be evm or substrate'
    },
    name: { 
      required: false, 
      type: 'string', 
      minLength: 3, 
      maxLength: 20,
      pattern: /^[a-zA-Z0-9_]+$/
    }
  },
  pokemonId: {
    pokemonId: {
      required: true,
      type: 'string',
      validator: validateObjectId,
      message: 'Invalid pokemon ID format'
    }
  },
  listingId: {
    listingId: {
      required: true,
      type: 'string',
      validator: validateObjectId,
      message: 'Invalid listing ID format'
    }
  },
  price: {
    price: {
      required: true,
      type: 'number',
      min: 0.0001,
      max: 1000000
    }
  },
  userName: {
    name: {
      required: true,
      type: 'string',
      minLength: 3,
      maxLength: 20,
      pattern: /^[a-zA-Z0-9_]+$/
    }
  }
};

module.exports = {
  validateBody,
  validateWalletAddress,
  validateObjectId,
  sanitizeString,
  schemas
};

