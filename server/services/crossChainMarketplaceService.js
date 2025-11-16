const xcmService = require('./xcmService');
const marketplaceService = require('./marketplaceService');
const { ethers } = require('ethers');

/**
 * Cross-Chain Marketplace Service
 * Aggregates marketplace listings from multiple parachains
 */
class CrossChainMarketplaceService {
  constructor() {
    this.marketplaceContracts = new Map();
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    await xcmService.initializeChain('moonbase');
    await xcmService.initializeChain('moonbeam');

    // Store marketplace contract addresses per chain (only if configured)
    if (process.env.MARKETPLACE_CONTRACT_ADDRESS) {
      this.marketplaceContracts.set('moonbase', process.env.MARKETPLACE_CONTRACT_ADDRESS);
    }
    if (process.env.MOONBEAM_MARKETPLACE_CONTRACT_ADDRESS) {
      this.marketplaceContracts.set('moonbeam', process.env.MOONBEAM_MARKETPLACE_CONTRACT_ADDRESS);
    }

    this.initialized = true;
    console.log('✅ Cross-Chain Marketplace Service initialized');
  }

  /**
   * Get all active listings across chains
   */
  async getActiveListingsMultiChain(limit = 50) {
    await this.initialize();

    const chains = ['moonbase', 'moonbeam'];
    const allListings = [];

    for (const chainName of chains) {
      try {
        const contractAddress = this.marketplaceContracts.get(chainName);
        if (!contractAddress) continue;

        const provider = await xcmService.getApi(chainName);
        const marketplaceABI = [
          'function getActiveListingsCount() external view returns (uint256)',
          'function getListing(uint256 listingId) external view returns (tuple(address seller, uint256 tokenId, uint256 price, uint256 createdAt, bool active))',
        ];

        const marketplaceContract = new ethers.Contract(
          contractAddress,
          marketplaceABI,
          provider
        );

        const count = await marketplaceContract.getActiveListingsCount();
        const listingCount = Math.min(Number(count), limit);

        // Fetch listings (simplified - in production, you'd have a better way to iterate)
        for (let i = 1; i <= listingCount; i++) {
          try {
            const listing = await marketplaceContract.getListing(i);
            if (listing.active) {
              allListings.push({
                chain: chainName,
                listingId: i,
                seller: listing.seller,
                tokenId: listing.tokenId.toString(),
                price: ethers.formatEther(listing.price),
                priceWei: listing.price.toString(),
                createdAt: new Date(Number(listing.createdAt) * 1000).toISOString(),
                contractAddress,
              });
            }
          } catch (error) {
            // Listing doesn't exist or error fetching
            continue;
          }
        }
      } catch (error) {
        console.error(`Error fetching listings from ${chainName}:`, error);
      }
    }

    // Sort by price (lowest first)
    allListings.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));

    return {
      listings: allListings,
      total: allListings.length,
      chains: chains.filter((chain) => this.marketplaceContracts.has(chain)),
    };
  }

  /**
   * Get listings for a specific NFT across chains
   */
  async getListingsForNFTMultiChain(tokenId) {
    await this.initialize();

    const chains = ['moonbase', 'moonbeam'];
    const listings = [];

    for (const chainName of chains) {
      try {
        const contractAddress = this.marketplaceContracts.get(chainName);
        if (!contractAddress) continue;

        const provider = await xcmService.getApi(chainName);
        const marketplaceABI = [
          'function getActiveListingsCount() external view returns (uint256)',
          'function getListing(uint256 listingId) external view returns (tuple(address seller, uint256 tokenId, uint256 price, uint256 createdAt, bool active))',
        ];

        const marketplaceContract = new ethers.Contract(
          contractAddress,
          marketplaceABI,
          provider
        );

        const count = await marketplaceContract.getActiveListingsCount();
        const listingCount = Number(count);

        // Search for listings with matching tokenId
        for (let i = 1; i <= listingCount; i++) {
          try {
            const listing = await marketplaceContract.getListing(i);
            if (listing.active && listing.tokenId.toString() === tokenId.toString()) {
              listings.push({
                chain: chainName,
                listingId: i,
                seller: listing.seller,
                tokenId: listing.tokenId.toString(),
                price: ethers.formatEther(listing.price),
                priceWei: listing.price.toString(),
                createdAt: new Date(Number(listing.createdAt) * 1000).toISOString(),
                contractAddress,
              });
            }
          } catch (error) {
            continue;
          }
        }
      } catch (error) {
        console.error(`Error fetching listings from ${chainName}:`, error);
      }
    }

    return listings;
  }

  /**
   * Purchase NFT from cross-chain listing
   */
  async purchaseCrossChain(chainName, listingId, buyerSigner) {
    await this.initialize();

    const contractAddress = this.marketplaceContracts.get(chainName);
    if (!contractAddress) {
      throw new Error(`Marketplace contract not configured for ${chainName}`);
    }

    const provider = await xcmService.getApi(chainName);
    const marketplaceABI = [
      'function purchase(uint256 listingId) external payable',
      'function getListing(uint256 listingId) external view returns (tuple(address seller, uint256 tokenId, uint256 price, uint256 createdAt, bool active))',
    ];

    const marketplaceContract = new ethers.Contract(
      contractAddress,
      marketplaceABI,
      buyerSigner
    );

    // Get listing details
    const listing = await marketplaceContract.getListing(listingId);
    if (!listing.active) {
      throw new Error('Listing is not active');
    }

    // Execute purchase
    const tx = await marketplaceContract.purchase(listingId, {
      value: listing.price,
    });

    const receipt = await tx.wait();

    return {
      success: true,
      txHash: receipt.hash,
      chain: chainName,
      listingId,
      tokenId: listing.tokenId.toString(),
      price: ethers.formatEther(listing.price),
    };
  }

  /**
   * Register marketplace contract for a chain
   */
  registerMarketplaceContract(chainName, contractAddress) {
    this.marketplaceContracts.set(chainName, contractAddress);
  }
}

const crossChainMarketplaceService = new CrossChainMarketplaceService();
module.exports = crossChainMarketplaceService;

