const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

/**
 * Marketplace Service
 * Interacts with on-chain Marketplace contract
 */
class MarketplaceService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.contractAddress = process.env.MARKETPLACE_CONTRACT_ADDRESS;
    this.rpcUrl = process.env.MOONBASE_RPC_URL || 'https://rpc.api.moonbase.moonbeam.network';
    
    this.initialize();
  }

  async initialize() {
    try {
      this.provider = new ethers.JsonRpcProvider(this.rpcUrl);

      const privateKey = process.env.PRIVATE_KEY;
      if (privateKey) {
        this.signer = new ethers.Wallet(privateKey, this.provider);
        console.log('✅ Marketplace Service initialized with signer:', this.signer.address);
      } else {
        console.warn('⚠️  No PRIVATE_KEY found. Marketplace operations will be read-only.');
      }

      if (!this.contractAddress) {
        this.contractAddress = this.loadContractAddress();
      }

      if (this.contractAddress) {
        const ABI = this.getABI();
        if (this.signer) {
          this.contract = new ethers.Contract(this.contractAddress, ABI, this.signer);
        } else {
          this.contract = new ethers.Contract(this.contractAddress, ABI, this.provider);
        }
        console.log('✅ Marketplace Contract connected:', this.contractAddress);
      } else {
        // Marketplace is optional - only warn if actually needed
        // Will be initialized when contract is deployed
      }
    } catch (error) {
      console.error('❌ Error initializing Marketplace Service:', error);
    }
  }

  loadContractAddress() {
    try {
      const deploymentFile = path.join(__dirname, '../deployments/marketplace-moonbase-deployment.json');
      if (fs.existsSync(deploymentFile)) {
        const deployment = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
        return deployment.contractAddress;
      }
    } catch (error) {
      console.error('Error loading deployment file:', error);
    }
    return null;
  }

  getABI() {
    // Minimal ABI for marketplace operations
    return [
      "function createListing(uint256 tokenId, uint256 price) external",
      "function cancelListing(uint256 listingId) external",
      "function purchase(uint256 listingId) external payable",
      "function updatePrice(uint256 listingId, uint256 newPrice) external",
      "function getListing(uint256 listingId) external view returns (tuple(address seller, uint256 tokenId, uint256 price, uint256 createdAt, bool active))",
      "function getActiveListingsCount() external view returns (uint256)",
      "function marketplaceFee() external view returns (uint256)",
      "event ListingCreated(uint256 indexed listingId, address indexed seller, uint256 indexed tokenId, uint256 price)",
      "event NFTPurchased(uint256 indexed listingId, address indexed buyer, address indexed seller, uint256 indexed tokenId, uint256 price)",
      "event ListingCancelled(uint256 indexed listingId, address indexed seller)"
    ];
  }

  /**
   * Create a listing on-chain
   */
  async createListing(tokenId, price) {
    if (!this.contract || !this.signer) {
      throw new Error('Marketplace contract or signer not initialized');
    }

    try {
      const tx = await this.contract.createListing(tokenId, price);
      console.log('📝 Marketplace listing transaction sent:', tx.hash);
      
      const receipt = await tx.wait();
      
      // Get listing ID from event
      const listingCreatedEvent = receipt.logs.find(log => {
        try {
          const parsed = this.contract.interface.parseLog(log);
          return parsed && parsed.name === 'ListingCreated';
        } catch {
          return false;
        }
      });

      let listingId = null;
      if (listingCreatedEvent) {
        const parsed = this.contract.interface.parseLog(listingCreatedEvent);
        listingId = parsed.args.listingId.toString();
      }

      return {
        listingId,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      console.error('❌ Error creating marketplace listing:', error);
      throw error;
    }
  }

  /**
   * Get listing details
   */
  async getListing(listingId) {
    if (!this.contract) {
      throw new Error('Marketplace contract not initialized');
    }

    try {
      const listing = await this.contract.getListing(listingId);
      return {
        seller: listing.seller,
        tokenId: listing.tokenId.toString(),
        price: ethers.formatEther(listing.price),
        createdAt: new Date(Number(listing.createdAt) * 1000).toISOString(),
        active: listing.active,
      };
    } catch (error) {
      console.error('Error fetching listing:', error);
      throw error;
    }
  }

  /**
   * Get active listings count
   */
  async getActiveListingsCount() {
    if (!this.contract) {
      return 0;
    }

    try {
      const count = await this.contract.getActiveListingsCount();
      return Number(count.toString());
    } catch (error) {
      console.error('Error fetching active listings count:', error);
      return 0;
    }
  }

  isReady() {
    return !!(this.contract && this.contractAddress);
  }
}

const marketplaceService = new MarketplaceService();
module.exports = marketplaceService;

