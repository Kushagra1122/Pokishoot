import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

/**
 * Cross-Chain Service
 * Handles all cross-chain API calls
 */
class CrossChainService {
  /**
   * Get supported chains
   */
  async getSupportedChains() {
    try {
      const response = await axios.get(`${API_BASE}/api/crosschain/chains`);
      return response.data;
    } catch (error) {
      console.error('Error getting supported chains:', error);
      throw error;
    }
  }

  /**
   * Get cross-chain marketplace listings
   */
  async getCrossChainListings(limit = 50) {
    try {
      const response = await axios.get(`${API_BASE}/api/crosschain/marketplace/listings`, {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      console.error('Error getting cross-chain listings:', error);
      throw error;
    }
  }

  /**
   * Get listings for specific NFT across chains
   */
  async getListingsForNFT(tokenId) {
    try {
      const response = await axios.get(`${API_BASE}/api/crosschain/marketplace/nft/${tokenId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting listings for NFT:', error);
      throw error;
    }
  }

  /**
   * Get NFTs owned by address across chains
   */
  async getNFTsByOwner(address) {
    try {
      const response = await axios.get(`${API_BASE}/api/crosschain/nfts/${address}`);
      return response.data;
    } catch (error) {
      console.error('Error getting NFTs by owner:', error);
      throw error;
    }
  }

  /**
   * Query NFT across multiple chains
   */
  async queryNFTMultiChain(tokenId) {
    try {
      const response = await axios.get(`${API_BASE}/api/crosschain/nft/${tokenId}`);
      return response.data;
    } catch (error) {
      console.error('Error querying NFT across chains:', error);
      throw error;
    }
  }

  /**
   * Get cross-chain leaderboard
   */
  async getCrossChainLeaderboard(count = 10) {
    try {
      const response = await axios.get(`${API_BASE}/api/crosschain/leaderboard`, {
        params: { count },
      });
      return response.data;
    } catch (error) {
      console.error('Error getting cross-chain leaderboard:', error);
      throw error;
    }
  }

  /**
   * Get player stats across chains
   */
  async getPlayerStatsMultiChain(address) {
    try {
      const response = await axios.get(`${API_BASE}/api/crosschain/leaderboard/player/${address}`);
      return response.data;
    } catch (error) {
      console.error('Error getting player stats:', error);
      throw error;
    }
  }

  /**
   * Prepare cross-chain transfer
   */
  async prepareTransfer(sourceChain, destChain, tokenId, recipientAddress, token) {
    try {
      const response = await axios.post(
        `${API_BASE}/api/crosschain/transfer/prepare`,
        {
          sourceChain,
          destChain,
          tokenId,
          recipientAddress,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error preparing cross-chain transfer:', error);
      throw error;
    }
  }
}

export default new CrossChainService();

