const request = require('supertest');
const express = require('express');

// Mock the services BEFORE requiring routes
jest.mock('../services/xcmService');
jest.mock('../services/crossChainNFTService');
jest.mock('../services/crossChainMarketplaceService');
jest.mock('../services/crossChainLeaderboardService');
jest.mock('../middleware/authMiddleware', () => {
  return (req, res, next) => {
    req.user = { id: 'test-user' };
    next();
  };
});

const crossChainRoutes = require('../routes/crossChainRoutes');

const xcmService = require('../services/xcmService');
const crossChainNFTService = require('../services/crossChainNFTService');
const crossChainMarketplaceService = require('../services/crossChainMarketplaceService');
const crossChainLeaderboardService = require('../services/crossChainLeaderboardService');

const app = express();
app.use(express.json());
app.use('/api/crosschain', crossChainRoutes);

describe('Cross-Chain Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/crosschain/chains', () => {
    it('should return supported chains', async () => {
      xcmService.getSupportedChains.mockReturnValue(['moonbase', 'moonbeam']);
      xcmService.getChainConfig.mockImplementation((chainName) => {
        if (chainName === 'moonbase') {
          return { name: 'moonbase', type: 'evm', paraId: 1000, chainId: 1287 };
        }
        return { name: 'moonbeam', type: 'evm', paraId: 2004, chainId: 1284 };
      });

      const response = await request(app)
        .get('/api/crosschain/chains')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.chains).toBeInstanceOf(Array);
      expect(response.body.chains.length).toBe(2);
    });
  });

  describe('GET /api/crosschain/nft/:tokenId', () => {
    it('should query NFT across chains', async () => {
      const mockResults = [
        { chain: 'moonbase', owner: '0x123...', tokenURI: 'ipfs://...' },
        { chain: 'moonbeam', owner: '0x456...', tokenURI: 'ipfs://...' },
      ];

      crossChainNFTService.queryNFTMultiChain.mockResolvedValue(mockResults);

      const response = await request(app)
        .get('/api/crosschain/nft/123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.tokenId).toBe('123');
      expect(response.body.results).toEqual(mockResults);
    });

    it('should handle errors', async () => {
      crossChainNFTService.queryNFTMultiChain.mockRejectedValue(
        new Error('Query failed')
      );

      const response = await request(app)
        .get('/api/crosschain/nft/123')
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/crosschain/nfts/:address', () => {
    it('should get NFTs by owner', async () => {
      const mockNFTs = [
        { chain: 'moonbase', tokenIds: [1, 2], balance: 2 },
        { chain: 'moonbeam', tokenIds: [3], balance: 1 },
      ];

      crossChainNFTService.getNFTsByOwnerMultiChain.mockResolvedValue(mockNFTs);

      const response = await request(app)
        .get('/api/crosschain/nfts/0x1234567890123456789012345678901234567890')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.nfts).toEqual(mockNFTs);
      expect(response.body.total).toBe(3);
    });
  });

  describe('GET /api/crosschain/marketplace/listings', () => {
    it('should get cross-chain listings', async () => {
      const mockListings = {
        listings: [
          {
            chain: 'moonbase',
            listingId: 1,
            tokenId: '123',
            price: '1.5',
            seller: '0x123...',
          },
        ],
        total: 1,
        chains: ['moonbase', 'moonbeam'],
      };

      crossChainMarketplaceService.getActiveListingsMultiChain.mockResolvedValue(
        mockListings
      );

      const response = await request(app)
        .get('/api/crosschain/marketplace/listings')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.listings).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/crosschain/leaderboard', () => {
    it('should get cross-chain leaderboard', async () => {
      const mockLeaderboard = {
        players: [
          {
            player: '0x123...',
            elo: 1500,
            matchesWon: 10,
            matchesPlayed: 15,
            chains: ['moonbase', 'moonbeam'],
          },
        ],
        total: 1,
        chains: ['moonbase', 'moonbeam'],
      };

      crossChainLeaderboardService.getTopPlayersMultiChain.mockResolvedValue(
        mockLeaderboard
      );

      const response = await request(app)
        .get('/api/crosschain/leaderboard?count=10')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.players).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/crosschain/leaderboard/player/:address', () => {
    it('should get player stats across chains', async () => {
      const mockStats = {
        player: '0x123...',
        elo: 1500,
        matchesWon: 10,
        matchesPlayed: 15,
        chains: ['moonbase', 'moonbeam'],
        statsByChain: [
          { chain: 'moonbase', elo: 1500, matchesWon: 5 },
          { chain: 'moonbeam', elo: 1500, matchesWon: 5 },
        ],
      };

      crossChainLeaderboardService.getPlayerStatsMultiChain.mockResolvedValue(
        mockStats
      );

      const response = await request(app)
        .get('/api/crosschain/leaderboard/player/0x1234567890123456789012345678901234567890')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.elo).toBe(1500);
    });

    it('should return 404 if player not found', async () => {
      crossChainLeaderboardService.getPlayerStatsMultiChain.mockResolvedValue(
        null
      );

      await request(app)
        .get('/api/crosschain/leaderboard/player/0x1234567890123456789012345678901234567890')
        .expect(404);
    });
  });

  describe('POST /api/crosschain/transfer/prepare', () => {
    // Mock auth middleware to bypass authentication
    const mockAuthMiddleware = (req, res, next) => {
      req.user = { id: 'test-user' };
      next();
    };

    beforeEach(() => {
      // Replace auth middleware with mock
      const routes = require('../routes/crossChainRoutes');
      // Note: In a real scenario, we'd need to mock the middleware differently
    });

    it('should prepare cross-chain transfer', async () => {
      const mockXCMTransfer = {
        type: 'xcm_transfer',
        sourceChain: 'moonbase',
        destChain: 'moonbeam',
        tokenId: '123',
        recipientAddress: '0x123...',
      };

      xcmService.prepareXCMTransfer.mockResolvedValue(mockXCMTransfer);

      // Create app without auth middleware for this test
      const testApp = express();
      testApp.use(express.json());
      testApp.use('/api/crosschain', (req, res, next) => {
        req.user = { id: 'test-user' };
        next();
      }, crossChainRoutes);

      const response = await request(testApp)
        .post('/api/crosschain/transfer/prepare')
        .send({
          sourceChain: 'moonbase',
          destChain: 'moonbeam',
          tokenId: '123',
          recipientAddress: '0x1234567890123456789012345678901234567890',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.xcmTransfer).toEqual(mockXCMTransfer);
    });

    it('should return 400 for missing fields', async () => {
      // Create app without auth middleware for this test
      const testApp = express();
      testApp.use(express.json());
      testApp.use('/api/crosschain', (req, res, next) => {
        req.user = { id: 'test-user' };
        next();
      }, crossChainRoutes);

      const response = await request(testApp)
        .post('/api/crosschain/transfer/prepare')
        .send({
          sourceChain: 'moonbase',
          // Missing other required fields
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});

