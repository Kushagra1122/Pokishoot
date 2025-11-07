import { ethers } from 'ethers';

// MatchEscrow ABI (minimal)
const MATCH_ESCROW_ABI = [
  "function createMatch(bytes32 matchId, address playerA, address playerB) external payable",
  "function joinMatch(bytes32 matchId) external payable",
  "function submitResult(bytes32 matchId, address winner, uint256 scoreA, uint256 scoreB, uint256 serverNonce, bytes memory sigA, bytes memory sigB) external",
  "function cancelMatch(bytes32 matchId) external",
  "function getMatch(bytes32 matchId) external view returns (tuple(address playerA, address playerB, uint256 stake, bool playerADeposited, bool playerBDeposited, bool settled, bool canceled, uint256 createdAt))",
  "function getPoints(address player) external view returns (uint256)",
  "event MatchCreated(bytes32 indexed matchId, address indexed playerA, address indexed playerB, uint256 stake)",
  "event MatchJoined(bytes32 indexed matchId, address indexed player, uint256 stake)",
  "event MatchResult(bytes32 indexed matchId, address indexed winner, uint256 scoreA, uint256 scoreB, uint256 totalPayout, uint256 serverNonce)",
  "event MatchCanceled(bytes32 indexed matchId, string reason)"
];

const MATCH_ESCROW_ADDRESS = import.meta.env.VITE_MATCH_ESCROW_CONTRACT_ADDRESS;

/**
 * Generate match ID from game code
 */
export function generateMatchId(gameCode) {
  return ethers.keccak256(ethers.toUtf8Bytes(gameCode));
}

/**
 * Get MatchEscrow contract instance
 */
export function getMatchEscrowContract(signerOrProvider) {
  if (!MATCH_ESCROW_ADDRESS) {
    console.error("MATCH_ESCROW_CONTRACT_ADDRESS is not set in environment variables.");
    return null;
  }
  return new ethers.Contract(MATCH_ESCROW_ADDRESS, MATCH_ESCROW_ABI, signerOrProvider);
}

/**
 * Create a match on blockchain
 * @param {ethers.Signer} signer - Wallet signer
 * @param {string} gameCode - Game code
 * @param {string} playerAAddress - Player A wallet address
 * @param {string} playerBAddress - Player B wallet address
 * @param {string} stakeAmount - Stake amount in GLMR (e.g., "0.1")
 * @returns {Promise<Object>} Transaction hash and match ID
 */
export async function createMatch(signer, gameCode, playerAAddress, playerBAddress, stakeAmount) {
  const contract = getMatchEscrowContract(signer);
  if (!contract) throw new Error("MatchEscrow contract not initialized.");

  // Validate stakeAmount
  if (!stakeAmount || stakeAmount === null || stakeAmount === undefined || stakeAmount === '') {
    throw new Error("Stake amount is required and must be a valid number");
  }

  const matchId = generateMatchId(gameCode);
  const stakeWei = ethers.parseEther(String(stakeAmount));

  try {
    const tx = await contract.createMatch(matchId, playerAAddress, playerBAddress, {
      value: stakeWei
    });
    
    console.log('📝 Creating match on blockchain...', tx.hash);
    const receipt = await tx.wait();
    
    return {
      matchId: matchId,
      txHash: tx.hash,
      blockNumber: receipt.blockNumber
    };
  } catch (error) {
    console.error("Error creating match:", error);
    throw error;
  }
}

/**
 * Join an existing match
 * @param {ethers.Signer} signer - Wallet signer
 * @param {string} gameCode - Game code
 * @param {string} stakeAmount - Stake amount in DEV
 * @returns {Promise<Object>} Transaction hash
 */
export async function joinMatch(signer, gameCode, stakeAmount) {
  const contract = getMatchEscrowContract(signer);
  if (!contract) throw new Error("MatchEscrow contract not initialized.");

  // Validate stakeAmount
  if (!stakeAmount || stakeAmount === null || stakeAmount === undefined || stakeAmount === '') {
    throw new Error("Stake amount is required and must be a valid number");
  }

  const matchId = generateMatchId(gameCode);
  const stakeWei = ethers.parseEther(String(stakeAmount));

  try {
    const tx = await contract.joinMatch(matchId, {
      value: stakeWei
    });
    
    console.log('📝 Joining match on blockchain...', tx.hash);
    const receipt = await tx.wait();
    
    return {
      txHash: tx.hash,
      blockNumber: receipt.blockNumber
    };
  } catch (error) {
    console.error("Error joining match:", error);
    throw error;
  }
}

/**
 * Get match details from blockchain
 * @param {ethers.Provider} provider - Provider
 * @param {string} gameCode - Game code
 * @returns {Promise<Object>} Match details
 */
export async function getMatch(provider, gameCode) {
  const contract = getMatchEscrowContract(provider);
  if (!contract) throw new Error("MatchEscrow contract not initialized.");

  const matchId = generateMatchId(gameCode);

  try {
    const match = await contract.getMatch(matchId);
    return {
      playerA: match.playerA,
      playerB: match.playerB,
      stake: ethers.formatEther(match.stake),
      playerADeposited: match.playerADeposited,
      playerBDeposited: match.playerBDeposited,
      settled: match.settled,
      canceled: match.canceled,
      createdAt: new Date(Number(match.createdAt) * 1000)
    };
  } catch (error) {
    console.error("Error getting match:", error);
    return null;
  }
}

/**
 * Cancel a match (refund deposits)
 * @param {ethers.Signer} signer - Wallet signer
 * @param {string} gameCode - Game code
 * @returns {Promise<Object>} Transaction hash
 */
export async function cancelMatch(signer, gameCode) {
  const contract = getMatchEscrowContract(signer);
  if (!contract) throw new Error("MatchEscrow contract not initialized.");

  const matchId = generateMatchId(gameCode);

  try {
    const tx = await contract.cancelMatch(matchId);
    const receipt = await tx.wait();
    
    return {
      txHash: tx.hash,
      blockNumber: receipt.blockNumber
    };
  } catch (error) {
    console.error("Error canceling match:", error);
    throw error;
  }
}

/**
 * Get player points
 * @param {ethers.Provider} provider - Provider
 * @param {string} playerAddress - Player wallet address
 * @returns {Promise<number>} Player points
 */
export async function getPlayerPoints(provider, playerAddress) {
  const contract = getMatchEscrowContract(provider);
  if (!contract) throw new Error("MatchEscrow contract not initialized.");

  try {
    const points = await contract.getPoints(playerAddress);
    return Number(points);
  } catch (error) {
    console.error("Error getting player points:", error);
    return 0;
  }
}

