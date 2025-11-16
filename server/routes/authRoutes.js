const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { validateBody, schemas } = require('../middleware/validationMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');
const { strictRateLimiter } = require('../middleware/rateLimiter');

// Wallet-based authentication (Web3-native) - PRIMARY METHOD
router.post('/wallet/nonce', 
  strictRateLimiter(),
  validateBody(schemas.walletAddress),
  asyncHandler(authController.getWalletNonce)
);
router.post('/wallet/verify', 
  strictRateLimiter(),
  validateBody({
    message: { required: true, type: 'string', minLength: 10 },
    signature: { required: true, type: 'string', minLength: 10 }
  }),
  asyncHandler(authController.verifyWalletSignature)
);
router.post('/wallet/login', 
  strictRateLimiter(),
  validateBody(schemas.walletLogin),
  asyncHandler(authController.walletLogin)
);
router.put('/wallet/set-name', 
  authMiddleware,
  validateBody(schemas.userName),
  asyncHandler(authController.setWalletUserName)
);

// User routes
router.get('/me', authMiddleware, authController.me);
router.put('/profile', authMiddleware, authController.updateProfile);

// Link wallet to existing account (for users who want to add wallet to traditional account)
router.post('/link-wallet', 
  authMiddleware,
  validateBody({
    walletAddress: {
      required: true,
      type: 'string',
      validator: (value, body) => {
        const walletType = body?.walletType || 'evm';
        const { validateWalletAddress } = require('../middleware/validationMiddleware');
        return validateWalletAddress(value, walletType);
      },
      message: 'Invalid wallet address format'
    },
    walletType: {
      required: true,
      type: 'string',
      validator: (v) => ['evm', 'substrate'].includes(v),
      message: 'walletType must be evm or substrate'
    }
  }),
  asyncHandler(authController.linkWallet)
);

// Legacy routes (deprecated - kept for backward compatibility, but not recommended)
// router.post('/signup', authController.signup);
// router.post('/login', authController.login);

module.exports = router;
