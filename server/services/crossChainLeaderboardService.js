const xcmService = require('./xcmService');
const leaderboardService = require('./leaderboardService');
const { ethers } = require('ethers');

/**
 * Cross-Chain Leaderboard Service
 * Aggregates leaderboard data from multiple parachains
 */
class CrossChainLeaderboardService {
  constructor() {
    this.leaderboardContracts = new Map();
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    await xcmService.initializeChain('moonbase');
    await xcmService.initializeChain('moonbeam');

    // Store leaderboard contract addresses per chain (only if configured)
    if (process.env.LEADERBOARD_CONTRACT_ADDRESS) {
      this.leaderboardContracts.set('moonbase', process.env.LEADERBOARD_CONTRACT_ADDRESS);
    }
    if (process.env.MOONBEAM_LEADERBOARD_CONTRACT_ADDRESS) {
      this.leaderboardContracts.set('moonbeam', process.env.MOONBEAM_LEADERBOARD_CONTRACT_ADDRESS);
    }

    this.initialized = true;
    console.log('✅ Cross-Chain Leaderboard Service initialized');
  }

  /**
   * Get aggregated top players across all chains
   */
  async getTopPlayersMultiChain(count = 10) {
    await this.initialize();

    const chains = ['moonbase', 'moonbeam'];
    const allPlayers = new Map(); // address -> aggregated stats

    for (const chainName of chains) {
      try {
        const contractAddress = this.leaderboardContracts.get(chainName);
        if (!contractAddress) continue;

        const provider = await xcmService.getApi(chainName);
        const leaderboardABI = [
          'function getTopPlayers(uint256 count) external view returns (address[] memory, tuple(address player, uint256 elo, uint256 matchesWon, uint256 matchesPlayed, uint256 totalKills, uint256 totalDamage, uint256 lastUpdated)[] memory)',
        ];

        const leaderboardContract = new ethers.Contract(
          contractAddress,
          leaderboardABI,
          provider
        );

        const [players, stats] = await leaderboardContract.getTopPlayers(count);

        // Aggregate stats per player
        for (let i = 0; i < players.length; i++) {
          const address = players[i].toLowerCase();
          const playerStats = {
            player: players[i],
            elo: Number(stats[i].elo.toString()),
            matchesWon: Number(stats[i].matchesWon.toString()),
            matchesPlayed: Number(stats[i].matchesPlayed.toString()),
            totalKills: Number(stats[i].totalKills.toString()),
            totalDamage: Number(stats[i].totalDamage.toString()),
            lastUpdated: new Date(Number(stats[i].lastUpdated) * 1000).toISOString(),
            chains: [chainName],
          };

          if (allPlayers.has(address)) {
            // Aggregate with existing stats
            const existing = allPlayers.get(address);
            existing.elo = Math.max(existing.elo, playerStats.elo); // Use highest ELO
            existing.matchesWon += playerStats.matchesWon;
            existing.matchesPlayed += playerStats.matchesPlayed;
            existing.totalKills += playerStats.totalKills;
            existing.totalDamage += playerStats.totalDamage;
            existing.chains.push(chainName);
          } else {
            allPlayers.set(address, playerStats);
          }
        }
      } catch (error) {
        console.error(`Error fetching leaderboard from ${chainName}:`, error);
      }
    }

    // Convert to array and sort by ELO
    const aggregatedPlayers = Array.from(allPlayers.values());
    aggregatedPlayers.sort((a, b) => b.elo - a.elo);

    return {
      players: aggregatedPlayers.slice(0, count),
      total: aggregatedPlayers.length,
      chains: chains.filter((chain) => this.leaderboardContracts.has(chain)),
    };
  }

  /**
   * Get player stats aggregated across chains
   */
  async getPlayerStatsMultiChain(playerAddress) {
    await this.initialize();

    const chains = ['moonbase', 'moonbeam'];
    const statsByChain = [];

    for (const chainName of chains) {
      try {
        const contractAddress = this.leaderboardContracts.get(chainName);
        if (!contractAddress) continue;

        const provider = await xcmService.getApi(chainName);
        const leaderboardABI = [
          'function getPlayerStats(address player) external view returns (tuple(address player, uint256 elo, uint256 matchesWon, uint256 matchesPlayed, uint256 totalKills, uint256 totalDamage, uint256 lastUpdated))',
        ];

        const leaderboardContract = new ethers.Contract(
          contractAddress,
          leaderboardABI,
          provider
        );

        const stats = await leaderboardContract.getPlayerStats(playerAddress);

        statsByChain.push({
          chain: chainName,
          elo: Number(stats.elo.toString()),
          matchesWon: Number(stats.matchesWon.toString()),
          matchesPlayed: Number(stats.matchesPlayed.toString()),
          totalKills: Number(stats.totalKills.toString()),
          totalDamage: Number(stats.totalDamage.toString()),
          lastUpdated: new Date(Number(stats.lastUpdated) * 1000).toISOString(),
        });
      } catch (error) {
        console.error(`Error fetching player stats from ${chainName}:`, error);
      }
    }

    // Aggregate stats
    if (statsByChain.length === 0) {
      return null;
    }

    const aggregated = {
      player: playerAddress,
      chains: statsByChain.map((s) => s.chain),
      elo: Math.max(...statsByChain.map((s) => s.elo)),
      matchesWon: statsByChain.reduce((sum, s) => sum + s.matchesWon, 0),
      matchesPlayed: statsByChain.reduce((sum, s) => sum + s.matchesPlayed, 0),
      totalKills: statsByChain.reduce((sum, s) => sum + s.totalKills, 0),
      totalDamage: statsByChain.reduce((sum, s) => sum + s.totalDamage, 0),
      statsByChain,
    };

    return aggregated;
  }

  /**
   * Register leaderboard contract for a chain
   */
  registerLeaderboardContract(chainName, contractAddress) {
    this.leaderboardContracts.set(chainName, contractAddress);
  }
}

const crossChainLeaderboardService = new CrossChainLeaderboardService();
module.exports = crossChainLeaderboardService;

