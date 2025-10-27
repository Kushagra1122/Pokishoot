/**
 * ELO Rating System Calculator
 * Handles ELO calculation for multiplayer games
 */

class ELOCalculator {
  constructor() {
    this.K_FACTOR = 32; // Standard K-factor for rating changes
    this.RATING_FLOOR = 100; // Minimum rating
    this.INITIAL_RATING = 1000;
    
    // Tier definitions
    this.TIERS = {
      BRONZE: { min: 0, max: 999 },
      SILVER: { min: 1000, max: 1299 },
      GOLD: { min: 1300, max: 1599 },
      PLATINUM: { min: 1600, max: 1899 },
      DIAMOND: { min: 1900, max: 2199 },
      MASTER: { min: 2200, max: Infinity }
    };
  }

  /**
   * Get tier based on ELO rating
   */
  getTier(rating) {
    for (const [tierName, range] of Object.entries(this.TIERS)) {
      if (rating >= range.min && rating <= range.max) {
        return tierName.charAt(0) + tierName.slice(1).toLowerCase();
      }
    }
    return 'Bronze'; // Fallback
  }

  /**
   * Get rank within tier
   */
  getRank(rating, tier) {
    const tierRange = this.TIERS[tier.toUpperCase()];
    if (!tierRange) return 'Unranked';
    
    const range = tierRange.max - tierRange.min;
    const position = rating - tierRange.min;
    const percentage = (position / range) * 100;
    
    if (percentage >= 80) return 'I';
    if (percentage >= 60) return 'II';
    if (percentage >= 40) return 'III';
    if (percentage >= 20) return 'IV';
    return 'V';
  }

  /**
   * Calculate expected score (probability of winning)
   * Uses standard ELO formula: E = 1 / (1 + 10^((Ra - Rb) / 400))
   */
  expectedScore(ratingA, ratingB) {
    return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  }

  /**
   * Calculate ELO change for a single player
   * Formula: newRating = oldRating + K * (actualScore - expectedScore)
   */
  calculateRatingChange(oldRating, expectedScore, actualScore) {
    const ratingChange = this.K_FACTOR * (actualScore - expectedScore);
    const newRating = Math.max(this.RATING_FLOOR, oldRating + ratingChange);
    return {
      newRating: Math.round(newRating),
      ratingChange: Math.round(ratingChange)
    };
  }

  /**
   * Calculate ELO changes for multiple players in a match
   * For multiplayer games, we calculate based on final positions
   */
  calculateMultiplayerRatings(players) {
    if (players.length < 2) return players;
    
    // Sort players by their final score (winner first)
    const sortedPlayers = [...players].sort((a, b) => {
      // Primary: score
      if (b.finalScore !== a.finalScore) return b.finalScore - a.finalScore;
      // Secondary: kills
      if (b.kills !== a.kills) return b.kills - a.kills;
      // Tertiary: K/D ratio
      const aKD = a.deaths === 0 ? a.kills : a.kills / a.deaths;
      const bKD = b.deaths === 0 ? b.kills : b.kills / b.deaths;
      return bKD - aKD;
    });

    const results = [];

    for (let i = 0; i < sortedPlayers.length; i++) {
      const player = sortedPlayers[i];
      const position = i + 1;
      const totalPlayers = sortedPlayers.length;
      
      // Actual score: 1st place = 1.0, 2nd = 0.7, 3rd = 0.5, etc.
      // This gives diminishing returns for lower positions
      const actualScore = position === 1 ? 1.0 : (1.0 / position);
      
      // Calculate expected score based on average opponent rating
      const opponentRatings = sortedPlayers
        .filter((p, idx) => idx !== i)
        .map(p => p.currentRating);
      const averageOpponentRating = opponentRatings.reduce((a, b) => a + b, 0) / opponentRatings.length;
      
      const expectedScore = this.expectedScore(player.currentRating, averageOpponentRating);
      
      // Calculate new rating
      const ratingChangeResult = this.calculateRatingChange(
        player.currentRating,
        expectedScore,
        actualScore
      );

      results.push({
        playerId: player.playerId,
        name: player.name,
        oldRating: player.currentRating,
        newRating: ratingChangeResult.newRating,
        ratingChange: ratingChangeResult.ratingChange,
        oldTier: this.getTier(player.currentRating),
        newTier: this.getTier(ratingChangeResult.newRating),
        position: position
      });
    }

    return results;
  }

  /**
   * Determine if match result should affect ratings
   */
  shouldUpdateRatings(matchType, playerCount) {
    return matchType === 'rated' && playerCount >= 2;
  }
}

module.exports = new ELOCalculator();

