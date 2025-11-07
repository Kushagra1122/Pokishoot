const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Contract ABI - minimal for minting
const POKEMON_NFT_ABI = [
  "function mintPokemon(address to, string memory name, string memory pokemonType, uint256 shootRange, uint256 shootPerMin, uint256 hitPoints, uint256 speed, string memory spriteURI, string memory tokenURI) external returns (uint256)",
  "function tokenURI(uint256 tokenId) external view returns (string memory)",
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function getPokemonData(uint256 tokenId) external view returns (tuple(string name, string pokemonType, uint256 shootRange, uint256 shootPerMin, uint256 hitPoints, uint256 speed, string spriteURI, uint256 mintedAt) data, uint256 level)",
  "function upgradeLevel(uint256 tokenId, uint256 newLevel) external",
  "function totalSupply() external view returns (uint256)",
  "function balanceOf(address owner) external view returns (uint256)",
  "event PokemonMinted(uint256 indexed tokenId, address indexed to, string name, string pokemonType, uint256 level)"
];

class NFTService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.contractAddress = process.env.NFT_CONTRACT_ADDRESS;
    this.rpcUrl = process.env.MOONBASE_RPC_URL || 'https://rpc.api.moonbase.moonbeam.network';
    
    this.initialize();
  }

  async initialize() {
    try {
      // Initialize provider
      this.provider = new ethers.JsonRpcProvider(this.rpcUrl);

      // Initialize signer if private key is provided
      const privateKey = process.env.PRIVATE_KEY;
      if (privateKey) {
        this.signer = new ethers.Wallet(privateKey, this.provider);
        console.log('✅ NFT Service initialized with signer:', this.signer.address);
      } else {
        console.warn('⚠️  No PRIVATE_KEY found. NFT minting will not work.');
      }

      // Load contract address from deployment file if not in env
      if (!this.contractAddress) {
        this.contractAddress = this.loadContractAddress();
      }

      // Initialize contract if address is available
      if (this.contractAddress) {
        if (this.signer) {
          this.contract = new ethers.Contract(this.contractAddress, POKEMON_NFT_ABI, this.signer);
        } else {
          this.contract = new ethers.Contract(this.contractAddress, POKEMON_NFT_ABI, this.provider);
        }
        console.log('✅ NFT Contract connected:', this.contractAddress);
      } else {
        console.warn('⚠️  NFT Contract address not configured');
      }
    } catch (error) {
      console.error('❌ Error initializing NFT Service:', error);
    }
  }

  loadContractAddress() {
    try {
      // Try to load from deployment file
      const deploymentFile = path.join(__dirname, '../deployments/moonbase-deployment.json');
      if (fs.existsSync(deploymentFile)) {
        const deployment = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
        return deployment.contractAddress;
      }
    } catch (error) {
      console.error('Error loading deployment file:', error);
    }
    return null;
  }

  /**
   * Mint a Pokemon NFT
   * @param {string} toAddress - Wallet address to mint to
   * @param {Object} pokemonData - Pokemon data
   * @returns {Promise<Object>} { tokenId, txHash }
   */
  async mintPokemon(toAddress, pokemonData) {
    if (!this.contract || !this.signer) {
      throw new Error('NFT contract or signer not initialized');
    }

    try {
      // Generate token URI (can be IPFS or server endpoint)
      const tokenURI = this.generateTokenURI(pokemonData);

      // Call mint function
      const tx = await this.contract.mintPokemon(
        toAddress,
        pokemonData.name,
        pokemonData.type,
        pokemonData.baseStats.shootRange,
        pokemonData.baseStats.shootPerMin,
        pokemonData.baseStats.hitPoints,
        pokemonData.baseStats.speed,
        pokemonData.sprite,
        tokenURI
      );

      console.log('📝 NFT Mint transaction sent:', tx.hash);

      // Wait for transaction
      const receipt = await tx.wait();

      // Get token ID from event
      const mintEvent = receipt.logs.find(log => {
        try {
          const parsed = this.contract.interface.parseLog(log);
          return parsed && parsed.name === 'PokemonMinted';
        } catch {
          return false;
        }
      });

      let tokenId = null;
      if (mintEvent) {
        const parsed = this.contract.interface.parseLog(mintEvent);
        tokenId = parsed.args.tokenId.toString();
      }

      return {
        tokenId,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      console.error('❌ Error minting NFT:', error);
      throw error;
    }
  }

  /**
   * Generate token URI for metadata
   * @param {Object} pokemonData - Pokemon data
   * @returns {string} Token URI
   */
  generateTokenURI(pokemonData) {
    // For now, return a server endpoint
    // In production, this should be IPFS or decentralized storage
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:4000';
    return `${baseUrl}/api/nft/metadata/${pokemonData._id}`;
  }

  /**
   * Get Pokemon NFT data
   * @param {number} tokenId - Token ID
   * @returns {Promise<Object>} Pokemon data
   */
  async getPokemonData(tokenId) {
    if (!this.contract) {
      throw new Error('NFT contract not initialized');
    }

    try {
      const [data, level] = await this.contract.getPokemonData(tokenId);
      return {
        tokenId: tokenId.toString(),
        name: data.name,
        type: data.pokemonType,
        level: level.toString(),
        baseStats: {
          shootRange: data.shootRange.toString(),
          shootPerMin: data.shootPerMin.toString(),
          hitPoints: data.hitPoints.toString(),
          speed: data.speed.toString(),
        },
        sprite: data.spriteURI,
        mintedAt: new Date(Number(data.mintedAt) * 1000).toISOString(),
      };
    } catch (error) {
      console.error('Error fetching Pokemon NFT data:', error);
      throw error;
    }
  }

  /**
   * Upgrade Pokemon level
   * @param {number} tokenId - Token ID
   * @param {number} newLevel - New level
   * @returns {Promise<Object>} Transaction receipt
   */
  async upgradeLevel(tokenId, newLevel) {
    if (!this.contract || !this.signer) {
      throw new Error('NFT contract or signer not initialized');
    }

    try {
      const tx = await this.contract.upgradeLevel(tokenId, newLevel);
      const receipt = await tx.wait();
      return {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      console.error('Error upgrading level:', error);
      throw error;
    }
  }

  /**
   * Check if service is ready
   * @returns {boolean}
   */
  isReady() {
    return !!(this.contract && this.signer && this.contractAddress);
  }
}

// Export singleton instance
const nftService = new NFTService();
module.exports = nftService;

