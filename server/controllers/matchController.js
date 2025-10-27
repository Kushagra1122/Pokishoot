const Match = require('../models/Match');
const User = require('../models/User');
const eloCalculator = require('../utils/eloCalculator');

/**
 * Save match result to database and update player stats
 */
exports.saveMatchResult = async (matchData) => {
  try {
    // Create match document
    const match = new Match(matchData);
    await match.save();

    console.log(`✅ Match saved: ${match.gameCode}`);

    // Update player stats and ELO ratings
    if (match.matchType === 'rated') {
      await this.updatePlayerStatsAndRatings(match);
    } else {
      await this.updatePlayerStatsOnly(match);
    }

    return match;
  } catch (error) {
    console.error('❌ Error saving match result:', error);
    throw error;
  }
};

/**
 * Update player stats and ELO ratings (for rated matches)
 */
exports.updatePlayerStatsAndRatings = async (match) => {
  try {
    // Prepare player data for ELO calculation
    const playersData = match.players.map(p => ({
      playerId: p.playerId,
      name: p.name,
      currentRating: 1000, // Will be fetched from user
      finalScore: p.score,
      kills: p.kills,
      deaths: p.deaths
    }));

    // Fetch current ratings from users
    for (let i = 0; i < playersData.length; i++) {
      const user = await User.findById(playersData[i].playerId);
      if (user && user.ranking) {
        playersData[i].currentRating = user.ranking.elo || 1000;
      }
    }

    // Calculate ELO changes
    const eloResults = eloCalculator.calculateMultiplayerRatings(playersData);

    // Update each player's stats and rating
    for (let i = 0; i < match.players.length; i++) {
      const playerData = match.players[i];
      const eloResult = eloResults.find(r => r.playerId.toString() === playerData.playerId.toString());
      
      const user = await User.findById(playerData.playerId);
      if (!user) continue;

      // Update stats
      user.stats.totalKills += playerData.kills;
      user.stats.totalDeaths += playerData.deaths;
      user.stats.totalAssists += playerData.assists || 0;
      user.stats.totalDamageDealt += playerData.damageDealt || 0;
      user.stats.totalDamageTaken += playerData.damageTaken || 0;
      user.stats.matchesPlayed += 1;

      // Update accuracy (rolling average)
      const newAccuracy = playerData.accuracy || 0;
      const totalMatches = user.stats.matchesPlayed;
      user.stats.accuracy = ((user.stats.accuracy * (totalMatches - 1)) + newAccuracy) / totalMatches;

      // Update survival time average
      const survivalTime = playerData.survivalTime || 0;
      const currentAvg = user.stats.averageSurvivalTime || 0;
      user.stats.averageSurvivalTime = ((currentAvg * (totalMatches - 1)) + survivalTime) / totalMatches;

      // Check if this player won
      const isWinner = match.winner && match.winner.toString() === user._id.toString();
      if (isWinner) {
        user.stats.matchesWon += 1;
      }

      // Update ELO rating if applicable
      if (eloResult) {
        user.ranking.elo = eloResult.newRating;
        user.ranking.tier = eloCalculator.getTier(eloResult.newRating);
        user.ranking.rank = eloCalculator.getRank(eloResult.newRating, eloResult.newTier);
        
        console.log(`📊 ${user.name}: ${eloResult.oldRating} → ${eloResult.newRating} (${eloResult.ratingChange > 0 ? '+' : ''}${eloResult.ratingChange})`);
      }

      // Add match to history (keep last 50)
      user.matchHistory.unshift(match._id);
      if (user.matchHistory.length > 50) {
        user.matchHistory.pop();
      }

      // Update last active
      user.lastActive = new Date();

      await user.save();
    }

    console.log(`✅ Updated stats and ratings for ${playersData.length} players`);
  } catch (error) {
    console.error('❌ Error updating player stats and ratings:', error);
    throw error;
  }
};

/**
 * Update player stats only (for friendly matches)
 */
exports.updatePlayerStatsOnly = async (match) => {
  try {
    for (const playerData of match.players) {
      const user = await User.findById(playerData.playerId);
      if (!user) continue;

      // Update stats
      user.stats.totalKills += playerData.kills;
      user.stats.totalDeaths += playerData.deaths;
      user.stats.totalAssists += playerData.assists || 0;
      user.stats.totalDamageDealt += playerData.damageDealt || 0;
      user.stats.totalDamageTaken += playerData.damageTaken || 0;
      user.stats.matchesPlayed += 1;

      // Update accuracy (rolling average)
      const newAccuracy = playerData.accuracy || 0;
      const totalMatches = user.stats.matchesPlayed;
      user.stats.accuracy = ((user.stats.accuracy * (totalMatches - 1)) + newAccuracy) / totalMatches;

      // Update survival time average
      const survivalTime = playerData.survivalTime || 0;
      const currentAvg = user.stats.averageSurvivalTime || 0;
      user.stats.averageSurvivalTime = ((currentAvg * (totalMatches - 1)) + survivalTime) / totalMatches;

      // Check if this player won
      const isWinner = match.winner && match.winner.toString() === user._id.toString();
      if (isWinner) {
        user.stats.matchesWon += 1;
      }

      // Update last active
      user.lastActive = new Date();

      await user.save();
    }

    console.log(`✅ Updated stats for ${match.players.length} players`);
  } catch (error) {
    console.error('❌ Error updating player stats:', error);
    throw error;
  }
};

/**
 * Get match history for a user
 */
exports.getUserMatchHistory = async (userId, limit = 20) => {
  try {
    const matches = await Match.find({
      'players.playerId': userId
    })
    .sort({ startedAt: -1 })
    .limit(limit)
    .exec();

    return matches;
  } catch (error) {
    console.error('❌ Error fetching user match history:', error);
    throw error;
  }
};

/**
 * Get match details
 */
exports.getMatchDetails = async (matchId) => {
  try {
    const match = await Match.findById(matchId);
    return match;
  } catch (error) {
    console.error('❌ Error fetching match details:', error);
    throw error;
  }
};

/**
 * Get leaderboard (top players)
 */
exports.getLeaderboard = async (limit = 100) => {
  try {
    const users = await User.find({
      'stats.matchesPlayed': { $gt: 0 }
    })
    .sort({ 'ranking.elo': -1 })
    .limit(limit)
    .select('name stats ranking')
    .exec();

    return users;
  } catch (error) {
    console.error('❌ Error fetching leaderboard:', error);
    throw error;
  }
};

