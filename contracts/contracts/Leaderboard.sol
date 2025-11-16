// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title On-Chain Leaderboard
 * @dev Immutable leaderboard for player rankings and achievements
 */
contract Leaderboard is Ownable {
    struct PlayerStats {
        address player;
        uint256 elo;
        uint256 matchesWon;
        uint256 matchesPlayed;
        uint256 totalKills;
        uint256 totalDamage;
        uint256 lastUpdated;
    }
    
    struct Achievement {
        uint256 id;
        string name;
        string description;
        uint256 timestamp;
    }
    
    // Mapping from player address to stats
    mapping(address => PlayerStats) public playerStats;
    
    // Mapping from player address to achievements
    mapping(address => Achievement[]) public achievements;
    
    // Top players array (sorted by ELO)
    address[] public topPlayers;
    uint256 public constant MAX_TOP_PLAYERS = 100;
    
    // Events
    event StatsUpdated(
        address indexed player,
        uint256 elo,
        uint256 matchesWon,
        uint256 matchesPlayed
    );
    
    event AchievementUnlocked(
        address indexed player,
        uint256 achievementId,
        string name
    );
    
    constructor() Ownable() {}
    
    /**
     * @dev Update player stats (only owner or authorized contracts)
     */
    function updateStats(
        address player,
        uint256 elo,
        uint256 matchesWon,
        uint256 matchesPlayed,
        uint256 totalKills,
        uint256 totalDamage
    ) external onlyOwner {
        PlayerStats storage stats = playerStats[player];
        
        stats.player = player;
        stats.elo = elo;
        stats.matchesWon = matchesWon;
        stats.matchesPlayed = matchesPlayed;
        stats.totalKills = totalKills;
        stats.totalDamage = totalDamage;
        stats.lastUpdated = block.timestamp;
        
        // Update top players list
        _updateTopPlayers(player);
        
        emit StatsUpdated(player, elo, matchesWon, matchesPlayed);
    }
    
    /**
     * @dev Unlock achievement for a player
     */
    function unlockAchievement(
        address player,
        uint256 achievementId,
        string memory name,
        string memory description
    ) external onlyOwner {
        achievements[player].push(Achievement({
            id: achievementId,
            name: name,
            description: description,
            timestamp: block.timestamp
        }));
        
        emit AchievementUnlocked(player, achievementId, name);
    }
    
    /**
     * @dev Get player stats
     */
    function getPlayerStats(address player) external view returns (PlayerStats memory) {
        return playerStats[player];
    }
    
    /**
     * @dev Get player achievements
     */
    function getPlayerAchievements(address player) external view returns (Achievement[] memory) {
        return achievements[player];
    }
    
    /**
     * @dev Get top N players
     */
    function getTopPlayers(uint256 count) external view returns (address[] memory, PlayerStats[] memory) {
        uint256 length = count > topPlayers.length ? topPlayers.length : count;
        address[] memory players = new address[](length);
        PlayerStats[] memory stats = new PlayerStats[](length);
        
        for (uint256 i = 0; i < length; i++) {
            players[i] = topPlayers[i];
            stats[i] = playerStats[topPlayers[i]];
        }
        
        return (players, stats);
    }
    
    /**
     * @dev Internal function to update top players list
     */
    function _updateTopPlayers(address player) internal {
        PlayerStats memory stats = playerStats[player];
        
        // Check if player is already in top list
        bool inList = false;
        uint256 index = 0;
        for (uint256 i = 0; i < topPlayers.length; i++) {
            if (topPlayers[i] == player) {
                inList = true;
                index = i;
                break;
            }
        }
        
        // If not in list and has high enough ELO, add
        if (!inList && topPlayers.length < MAX_TOP_PLAYERS) {
            topPlayers.push(player);
            inList = true;
            index = topPlayers.length - 1;
        }
        
        // Sort by ELO (bubble up)
        if (inList) {
            while (index > 0 && playerStats[topPlayers[index - 1]].elo < stats.elo) {
                address temp = topPlayers[index];
                topPlayers[index] = topPlayers[index - 1];
                topPlayers[index - 1] = temp;
                index--;
            }
            
            // Remove if dropped out of top 100
            if (topPlayers.length > MAX_TOP_PLAYERS) {
                topPlayers.pop();
            }
        }
    }
}

