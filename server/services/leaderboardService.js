const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

/**
 * Leaderboard Service
 * Interacts with on-chain Leaderboard contract
 */
class LeaderboardService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.contractAddress = process.env.LEADERBOARD_CONTRACT_ADDRESS;
    this.rpcUrl = process.env.MOONBASE_RPC_URL || 'https://rpc.api.moonbase.moonbeam.network';
    
    this.initialize();
  }

  async initialize() {
    try {
      this.provider = new ethers.JsonRpcProvider(this.rpcUrl);

      const privateKey = process.env.PRIVATE_KEY;
      if (privateKey) {
        this.signer = new ethers.Wallet(privateKey, this.provider);
        console.log('✅ Leaderboard Service initialized with signer:', this.signer.address);
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
        console.log('✅ Leaderboard Contract connected:', this.contractAddress);
      } else {
        // Leaderboard is optional - will be initialized when contract is deployed
      }
    } catch (error) {
      console.error('❌ Error initializing Leaderboard Service:', error);
    }
  }

  loadContractAddress() {
    try {
      const deploymentFile = path.join(__dirname, '../deployments/leaderboard-moonbase-deployment.json');
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
    return [
      "function updateStats(address player, uint256 elo, uint256 matchesWon, uint256 matchesPlayed, uint256 totalKills, uint256 totalDamage) external",
      "function unlockAchievement(address player, uint256 achievementId, string memory name, string memory description) external",
      "function getPlayerStats(address player) external view returns (tuple(address player, uint256 elo, uint256 matchesWon, uint256 matchesPlayed, uint256 totalKills, uint256 totalDamage, uint256 lastUpdated))",
      "function getPlayerAchievements(address player) external view returns (tuple(uint256 id, string name, string description, uint256 timestamp)[])",
      "function getTopPlayers(uint256 count) external view returns (address[] memory, tuple(address player, uint256 elo, uint256 matchesWon, uint256 matchesPlayed, uint256 totalKills, uint256 totalDamage, uint256 lastUpdated)[] memory)",
      "event StatsUpdated(address indexed player, uint256 elo, uint256 matchesWon, uint256 matchesPlayed)",
      "event AchievementUnlocked(address indexed player, uint256 achievementId, string name)"
    ];
  }

  /**
   * Update player stats on-chain
   */
  async updateStats(playerAddress, stats) {
    if (!this.contract || !this.signer) {
      throw new Error('Leaderboard contract or signer not initialized');
    }

    try {
      const tx = await this.contract.updateStats(
        playerAddress,
        stats.elo || 1000,
        stats.matchesWon || 0,
        stats.matchesPlayed || 0,
        stats.totalKills || 0,
        stats.totalDamage || 0
      );

      const receipt = await tx.wait();
      return {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      console.error('❌ Error updating leaderboard stats:', error);
      throw error;
    }
  }

  /**
   * Unlock achievement for player
   */
  async unlockAchievement(playerAddress, achievementId, name, description) {
    if (!this.contract || !this.signer) {
      throw new Error('Leaderboard contract or signer not initialized');
    }

    try {
      const tx = await this.contract.unlockAchievement(
        playerAddress,
        achievementId,
        name,
        description
      );

      const receipt = await tx.wait();
      return {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      console.error('❌ Error unlocking achievement:', error);
      throw error;
    }
  }

  /**
   * Get player stats from chain
   */
  async getPlayerStats(playerAddress) {
    if (!this.contract) {
      return null;
    }

    try {
      const stats = await this.contract.getPlayerStats(playerAddress);
      return {
        player: stats.player,
        elo: Number(stats.elo.toString()),
        matchesWon: Number(stats.matchesWon.toString()),
        matchesPlayed: Number(stats.matchesPlayed.toString()),
        totalKills: Number(stats.totalKills.toString()),
        totalDamage: Number(stats.totalDamage.toString()),
        lastUpdated: new Date(Number(stats.lastUpdated) * 1000).toISOString(),
      };
    } catch (error) {
      console.error('Error fetching player stats:', error);
      return null;
    }
  }

  /**
   * Get top players
   */
  async getTopPlayers(count = 10) {
    if (!this.contract) {
      return { players: [], stats: [] };
    }

    try {
      const [players, stats] = await this.contract.getTopPlayers(count);
      return {
        players: players.map(p => p),
        stats: stats.map(s => ({
          player: s.player,
          elo: Number(s.elo.toString()),
          matchesWon: Number(s.matchesWon.toString()),
          matchesPlayed: Number(s.matchesPlayed.toString()),
          totalKills: Number(s.totalKills.toString()),
          totalDamage: Number(s.totalDamage.toString()),
        })),
      };
    } catch (error) {
      console.error('Error fetching top players:', error);
      return { players: [], stats: [] };
    }
  }

  isReady() {
    return !!(this.contract && this.contractAddress);
  }
}

const leaderboardService = new LeaderboardService();
module.exports = leaderboardService;

