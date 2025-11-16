const xcmService = require('./xcmService');
const nftService = require('./nftService');
const { ethers } = require('ethers');

/**
 * Cross-Chain NFT Service
 * Handles NFT transfers and queries across multiple parachains
 */
class CrossChainNFTService {
  constructor() {
    this.nftContracts = new Map(); // Store NFT contract addresses per chain
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    // Initialize XCM service
    await xcmService.initializeChain('moonbase');
    await xcmService.initializeChain('moonbeam');

    // Store NFT contract addresses per chain (only if configured)
    if (process.env.NFT_CONTRACT_ADDRESS) {
      this.nftContracts.set('moonbase', process.env.NFT_CONTRACT_ADDRESS);
    }
    if (process.env.MOONBEAM_NFT_CONTRACT_ADDRESS) {
      this.nftContracts.set('moonbeam', process.env.MOONBEAM_NFT_CONTRACT_ADDRESS);
    }

    this.initialized = true;
    console.log('✅ Cross-Chain NFT Service initialized');
  }

  /**
   * Transfer NFT across chains using XCM
   */
  async transferCrossChain(sourceChain, destChain, tokenId, recipientAddress, signer) {
    await this.initialize();

    try {
      // 1. Verify NFT ownership on source chain
      const sourceContract = this.nftContracts.get(sourceChain);
      if (!sourceContract) {
        throw new Error(`NFT contract not configured for ${sourceChain}`);
      }

      const sourceProvider = await xcmService.getApi(sourceChain);
      const nftABI = [
        'function ownerOf(uint256 tokenId) external view returns (address)',
        'function approve(address to, uint256 tokenId) external',
        'function transferFrom(address from, address to, uint256 tokenId) external',
      ];

      const nftContract = new ethers.Contract(sourceContract, nftABI, signer || sourceProvider);
      
      // Verify ownership
      const owner = await nftContract.ownerOf(tokenId);
      if (signer) {
        const signerAddress = await signer.getAddress();
        if (owner.toLowerCase() !== signerAddress.toLowerCase()) {
          throw new Error('Not the owner of this NFT');
        }
      }

      // 2. Prepare XCM transfer
      const xcmTransfer = await xcmService.prepareXCMTransfer(
        sourceChain,
        destChain,
        tokenId,
        recipientAddress
      );

      // 3. For Moonbeam, we need to use XCM precompile
      // This is a simplified version - full implementation would execute the XCM call
      if (sourceChain === 'moonbase' || sourceChain === 'moonbeam') {
        // In production, you would:
        // 1. Lock the NFT on source chain
        // 2. Send XCM message to destination chain
        // 3. Mint/bridge NFT on destination chain
        
        return {
          success: true,
          xcmTransfer,
          message: `XCM transfer prepared from ${sourceChain} to ${destChain}`,
          // In production, this would return the actual transaction hash
          txHash: null, // Would be populated after XCM execution
        };
      }

      throw new Error('Cross-chain transfer not yet implemented for this chain pair');
    } catch (error) {
      console.error('Error in cross-chain NFT transfer:', error);
      throw error;
    }
  }

  /**
   * Query NFT across multiple chains
   */
  async queryNFTMultiChain(tokenId) {
    await this.initialize();

    const chains = ['moonbase', 'moonbeam'];
    const results = await xcmService.aggregateCrossChainData(chains, async (chainName) => {
      const contractAddress = this.nftContracts.get(chainName);
      if (!contractAddress) return null;

      return await xcmService.queryCrossChainNFT(chainName, contractAddress, tokenId);
    });

    return results;
  }

  /**
   * Get all NFTs owned by an address across chains
   */
  async getNFTsByOwnerMultiChain(ownerAddress) {
    await this.initialize();

    const chains = ['moonbase', 'moonbeam'];
    const allNFTs = [];

    for (const chainName of chains) {
      try {
        const contractAddress = this.nftContracts.get(chainName);
        if (!contractAddress) continue;

        const provider = await xcmService.getApi(chainName);
        const nftABI = [
          'function balanceOf(address owner) external view returns (uint256)',
          'function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)',
        ];

        const nftContract = new ethers.Contract(contractAddress, nftABI, provider);
        const balance = await nftContract.balanceOf(ownerAddress);
        
        const tokenIds = [];
        for (let i = 0; i < Number(balance); i++) {
          const tokenId = await nftContract.tokenOfOwnerByIndex(ownerAddress, i);
          tokenIds.push(Number(tokenId));
        }

        allNFTs.push({
          chain: chainName,
          contractAddress,
          tokenIds,
          balance: Number(balance),
        });
      } catch (error) {
        console.error(`Error fetching NFTs from ${chainName}:`, error);
      }
    }

    return allNFTs;
  }

  /**
   * Register NFT contract for a chain
   */
  registerNFTContract(chainName, contractAddress) {
    this.nftContracts.set(chainName, contractAddress);
  }

  /**
   * Get NFT contract address for a chain
   */
  getNFTContract(chainName) {
    return this.nftContracts.get(chainName);
  }
}

const crossChainNFTService = new CrossChainNFTService();
module.exports = crossChainNFTService;

