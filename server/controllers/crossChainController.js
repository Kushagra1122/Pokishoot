const crossChainNFTService = require('../services/crossChainNFTService');
const crossChainMarketplaceService = require('../services/crossChainMarketplaceService');
const crossChainLeaderboardService = require('../services/crossChainLeaderboardService');
const xcmService = require('../services/xcmService');

/**
 * Cross-Chain Controller
 * Handles cross-chain operations via XCM
 */
class CrossChainController {
  /**
   * Get supported chains
   * GET /api/crosschain/chains
   */
  async getSupportedChains(req, res) {
    try {
      const chains = xcmService.getSupportedChains();
      const chainConfigs = chains.map((chainName) => {
        const config = xcmService.getChainConfig(chainName);
        return {
          name: chainName,
          type: config.type,
          paraId: config.paraId,
          chainId: config.chainId,
        };
      });

      res.json({
        success: true,
        chains: chainConfigs,
      });
    } catch (error) {
      console.error('Error getting supported chains:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get supported chains',
        error: error.message,
      });
    }
  }

  /**
   * Prepare cross-chain NFT transfer
   * POST /api/crosschain/transfer/prepare
   */
  async prepareTransfer(req, res) {
    try {
      const { sourceChain, destChain, tokenId, recipientAddress } = req.body;

      if (!sourceChain || !destChain || !tokenId || !recipientAddress) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: sourceChain, destChain, tokenId, recipientAddress',
        });
      }

      const xcmTransfer = await xcmService.prepareXCMTransfer(
        sourceChain,
        destChain,
        tokenId,
        recipientAddress
      );

      res.json({
        success: true,
        xcmTransfer,
        message: 'XCM transfer prepared successfully',
      });
    } catch (error) {
      console.error('Error preparing cross-chain transfer:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to prepare cross-chain transfer',
        error: error.message,
      });
    }
  }

  /**
   * Query NFT across multiple chains
   * GET /api/crosschain/nft/:tokenId
   */
  async queryNFTMultiChain(req, res) {
    try {
      const { tokenId } = req.params;

      const results = await crossChainNFTService.queryNFTMultiChain(tokenId);

      res.json({
        success: true,
        tokenId,
        results,
      });
    } catch (error) {
      console.error('Error querying NFT across chains:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to query NFT across chains',
        error: error.message,
      });
    }
  }

  /**
   * Get all NFTs owned by address across chains
   * GET /api/crosschain/nfts/:address
   */
  async getNFTsByOwner(req, res) {
    try {
      const { address } = req.params;

      if (!address) {
        return res.status(400).json({
          success: false,
          message: 'Address is required',
        });
      }

      const nfts = await crossChainNFTService.getNFTsByOwnerMultiChain(address);

      res.json({
        success: true,
        owner: address,
        nfts,
        total: nfts.reduce((sum, chain) => sum + chain.balance, 0),
      });
    } catch (error) {
      console.error('Error getting NFTs by owner:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get NFTs by owner',
        error: error.message,
      });
    }
  }

  /**
   * Get cross-chain marketplace listings
   * GET /api/crosschain/marketplace/listings
   */
  async getCrossChainListings(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 50;

      const listings = await crossChainMarketplaceService.getActiveListingsMultiChain(limit);

      res.json({
        success: true,
        ...listings,
      });
    } catch (error) {
      console.error('Error getting cross-chain listings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get cross-chain listings',
        error: error.message,
      });
    }
  }

  /**
   * Get listings for specific NFT across chains
   * GET /api/crosschain/marketplace/nft/:tokenId
   */
  async getListingsForNFT(req, res) {
    try {
      const { tokenId } = req.params;

      const listings = await crossChainMarketplaceService.getListingsForNFTMultiChain(tokenId);

      res.json({
        success: true,
        tokenId,
        listings,
      });
    } catch (error) {
      console.error('Error getting listings for NFT:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get listings for NFT',
        error: error.message,
      });
    }
  }

  /**
   * Get cross-chain leaderboard
   * GET /api/crosschain/leaderboard
   */
  async getCrossChainLeaderboard(req, res) {
    try {
      const count = parseInt(req.query.count) || 10;

      const leaderboard = await crossChainLeaderboardService.getTopPlayersMultiChain(count);

      res.json({
        success: true,
        ...leaderboard,
      });
    } catch (error) {
      console.error('Error getting cross-chain leaderboard:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get cross-chain leaderboard',
        error: error.message,
      });
    }
  }

  /**
   * Get player stats across chains
   * GET /api/crosschain/leaderboard/player/:address
   */
  async getPlayerStatsMultiChain(req, res) {
    try {
      const { address } = req.params;

      if (!address) {
        return res.status(400).json({
          success: false,
          message: 'Address is required',
        });
      }

      const stats = await crossChainLeaderboardService.getPlayerStatsMultiChain(address);

      if (!stats) {
        return res.status(404).json({
          success: false,
          message: 'Player stats not found',
        });
      }

      res.json({
        success: true,
        ...stats,
      });
    } catch (error) {
      console.error('Error getting player stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get player stats',
        error: error.message,
      });
    }
  }
}

const crossChainController = new CrossChainController();
module.exports = crossChainController;

