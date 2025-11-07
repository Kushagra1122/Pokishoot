import { ethers } from 'ethers';

// Contract ABI - This will be generated after deployment
// For now, we'll use a minimal ABI for the functions we need
const POKEMON_NFT_ABI = [
  "function mintPokemon(address to, string memory name, string memory pokemonType, uint256 shootRange, uint256 shootPerMin, uint256 hitPoints, uint256 speed, string memory spriteURI, string memory tokenURI) external returns (uint256)",
  "function tokenURI(uint256 tokenId) external view returns (string memory)",
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function balanceOf(address owner) external view returns (uint256)",
  "function getPokemonData(uint256 tokenId) external view returns (tuple(string name, string pokemonType, uint256 shootRange, uint256 shootPerMin, uint256 hitPoints, uint256 speed, string spriteURI, uint256 mintedAt) data, uint256 level)",
  "function getPokemonStats(uint256 tokenId) external view returns (uint256 shootRange, uint256 shootPerMin, uint256 hitPoints, uint256 speed)",
  "function pokemonLevels(uint256 tokenId) external view returns (uint256)",
  "function upgradeLevel(uint256 tokenId, uint256 newLevel) external",
  "function transferFrom(address from, address to, uint256 tokenId) external",
  "function safeTransferFrom(address from, address to, uint256 tokenId) external",
  "function totalSupply() external view returns (uint256)",
  "event PokemonMinted(uint256 indexed tokenId, address indexed to, string name, string pokemonType, uint256 level)",
  "event PokemonLevelUpgraded(uint256 indexed tokenId, uint256 oldLevel, uint256 newLevel)"
];

// Contract address - This should be set from environment variable
const CONTRACT_ADDRESS = import.meta.env.VITE_NFT_CONTRACT_ADDRESS || '';

/**
 * Get PokemonNFT contract instance
 * @param {ethers.BrowserProvider} provider - Ethers provider
 * @param {ethers.Signer} signer - Ethers signer (optional, for write operations)
 * @returns {ethers.Contract} Contract instance
 */
export function getPokemonNFTContract(provider, signer = null) {
  if (!CONTRACT_ADDRESS) {
    throw new Error('NFT Contract address not configured. Please set VITE_NFT_CONTRACT_ADDRESS');
  }

  if (signer) {
    return new ethers.Contract(CONTRACT_ADDRESS, POKEMON_NFT_ABI, signer);
  }
  return new ethers.Contract(CONTRACT_ADDRESS, POKEMON_NFT_ABI, provider);
}

/**
 * Mint a Pokemon NFT
 * @param {ethers.Signer} signer - Ethers signer
 * @param {Object} pokemonData - Pokemon data to mint
 * @param {string} pokemonData.name - Pokemon name
 * @param {string} pokemonData.type - Pokemon type
 * @param {Object} pokemonData.baseStats - Base stats
 * @param {string} pokemonData.sprite - Sprite URI
 * @param {string} tokenURI - Token metadata URI
 * @returns {Promise<ethers.ContractTransactionResponse>} Transaction response
 */
export async function mintPokemonNFT(signer, pokemonData, tokenURI) {
  const contract = getPokemonNFTContract(null, signer);

  const tx = await contract.mintPokemon(
    await signer.getAddress(),
    pokemonData.name,
    pokemonData.type,
    pokemonData.baseStats.shootRange,
    pokemonData.baseStats.shootPerMin,
    pokemonData.baseStats.hitPoints,
    pokemonData.baseStats.speed,
    pokemonData.sprite,
    tokenURI
  );

  return tx;
}

/**
 * Get Pokemon NFT data
 * @param {ethers.Provider} provider - Ethers provider
 * @param {number} tokenId - Token ID
 * @returns {Promise<Object>} Pokemon data
 */
export async function getPokemonNFTData(provider, tokenId) {
  const contract = getPokemonNFTContract(provider);

  try {
    const [data, level] = await contract.getPokemonData(tokenId);

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
 * Get Pokemon NFT stats with level multipliers
 * @param {ethers.Provider} provider - Ethers provider
 * @param {number} tokenId - Token ID
 * @returns {Promise<Object>} Pokemon stats
 */
export async function getPokemonNFTStats(provider, tokenId) {
  const contract = getPokemonNFTContract(provider);

  try {
    const [shootRange, shootPerMin, hitPoints, speed] = await contract.getPokemonStats(tokenId);

    return {
      shootRange: shootRange.toString(),
      shootPerMin: shootPerMin.toString(),
      hitPoints: hitPoints.toString(),
      speed: speed.toString(),
    };
  } catch (error) {
    console.error('Error fetching Pokemon NFT stats:', error);
    throw error;
  }
}

/**
 * Upgrade Pokemon level
 * @param {ethers.Signer} signer - Ethers signer
 * @param {number} tokenId - Token ID
 * @param {number} newLevel - New level
 * @returns {Promise<ethers.ContractTransactionResponse>} Transaction response
 */
export async function upgradePokemonLevel(signer, tokenId, newLevel) {
  const contract = getPokemonNFTContract(null, signer);

  const tx = await contract.upgradeLevel(tokenId, newLevel);

  return tx;
}

/**
 * Get NFT balance for an address
 * @param {ethers.Provider} provider - Ethers provider
 * @param {string} address - Wallet address
 * @returns {Promise<number>} Balance
 */
export async function getNFTBalance(provider, address) {
  const contract = getPokemonNFTContract(provider);

  try {
    const balance = await contract.balanceOf(address);
    return Number(balance);
  } catch (error) {
    console.error('Error fetching NFT balance:', error);
    return 0;
  }
}

/**
 * Get total supply of NFTs
 * @param {ethers.Provider} provider - Ethers provider
 * @returns {Promise<number>} Total supply
 */
export async function getTotalSupply(provider) {
  const contract = getPokemonNFTContract(provider);

  try {
    const supply = await contract.totalSupply();
    return Number(supply);
  } catch (error) {
    console.error('Error fetching total supply:', error);
    return 0;
  }
}

/**
 * Transfer NFT to another address
 * @param {ethers.Signer} signer - Ethers signer
 * @param {string} to - Recipient address
 * @param {number} tokenId - Token ID
 * @returns {Promise<ethers.ContractTransactionResponse>} Transaction response
 */
export async function transferNFT(signer, to, tokenId) {
  const contract = getPokemonNFTContract(null, signer);

  const tx = await contract.transferFrom(await signer.getAddress(), to, tokenId);

  return tx;
}

/**
 * Check if address owns a specific token
 * @param {ethers.Provider} provider - Ethers provider
 * @param {string} address - Wallet address
 * @param {number} tokenId - Token ID
 * @returns {Promise<boolean>} True if address owns the token
 */
export async function ownsToken(provider, address, tokenId) {
  try {
    const contract = getPokemonNFTContract(provider);
    const owner = await contract.ownerOf(tokenId);
    return owner.toLowerCase() === address.toLowerCase();
  } catch (error) {
    return false;
  }
}

