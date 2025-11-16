const express = require('express');
const router = express.Router();
const crossChainController = require('../controllers/crossChainController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * Cross-Chain Routes
 * All routes for XCM cross-chain operations
 */

// Public routes
router.get('/chains', crossChainController.getSupportedChains.bind(crossChainController));
router.get('/nft/:tokenId', crossChainController.queryNFTMultiChain.bind(crossChainController));
router.get('/nfts/:address', crossChainController.getNFTsByOwner.bind(crossChainController));
router.get('/marketplace/listings', crossChainController.getCrossChainListings.bind(crossChainController));
router.get('/marketplace/nft/:tokenId', crossChainController.getListingsForNFT.bind(crossChainController));
router.get('/leaderboard', crossChainController.getCrossChainLeaderboard.bind(crossChainController));
router.get('/leaderboard/player/:address', crossChainController.getPlayerStatsMultiChain.bind(crossChainController));

// Protected routes (require authentication)
router.post('/transfer/prepare', authMiddleware, crossChainController.prepareTransfer.bind(crossChainController));

module.exports = router;

