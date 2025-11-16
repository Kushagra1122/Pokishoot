const User = require('../models/User');
const Match = require('../models/Match');
const Listing = require('../models/Listing');

/**
 * Data Export Controller
 * Allows users to export their data in a portable format
 */
exports.exportUserData = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await User.findById(userId)
      .populate('pokemon.pokemonId')
      .populate('matchHistory')
      .populate('preferredPokemon');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's listings
    const listings = await Listing.find({ sellerId: userId });

    // Get user's matches
    const matches = await Match.find({
      $or: [
        { 'players.playerId': userId },
        { winner: userId }
      ]
    }).sort({ createdAt: -1 });

    // Create exportable data structure
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      user: {
        id: user._id.toString(),
        name: user.name,
        walletAddress: user.walletAddress,
        walletType: user.walletType,
        createdAt: user.createdAt || null,
      },
      pokemon: user.pokemon.map(p => ({
        pokemonId: p.pokemonId?._id?.toString() || p.pokemonId?.toString(),
        name: p.pokemonId?.name || 'Unknown',
        type: p.pokemonId?.type || 'Unknown',
        level: p.level,
        stats: p.stats,
        nftTokenId: p.nftTokenId,
        nftTxHash: p.nftTxHash,
      })),
      stats: {
        totalKills: user.stats.totalKills,
        totalDeaths: user.stats.totalDeaths,
        totalAssists: user.stats.totalAssists,
        matchesPlayed: user.stats.matchesPlayed,
        matchesWon: user.stats.matchesWon,
        totalDamageDealt: user.stats.totalDamageDealt,
        totalDamageTaken: user.stats.totalDamageTaken,
        accuracy: user.stats.accuracy,
        averageSurvivalTime: user.stats.averageSurvivalTime,
      },
      ranking: {
        elo: user.ranking.elo,
        tier: user.ranking.tier,
        rank: user.ranking.rank,
      },
      balance: user.balance,
      experience: user.experience,
      listings: listings.map(l => ({
        listingId: l._id.toString(),
        pokemonId: l.pokemon.pokemonId?.toString(),
        price: l.price,
        status: l.status,
        createdAt: l.createdAt,
      })),
      matches: matches.map(m => ({
        matchId: m._id.toString(),
        gameCode: m.gameCode,
        matchType: m.matchType,
        players: m.players.map(p => ({
          playerId: p.playerId?.toString(),
          name: p.name,
          score: p.score,
          kills: p.kills,
          deaths: p.deaths,
        })),
        winner: m.winner?.toString(),
        duration: m.duration,
        createdAt: m.createdAt,
      })),
      metadata: {
        exportFormat: 'PokeWars v1.0',
        blockchain: 'Moonbeam',
        dataOwnership: 'User owns all data',
        privacy: 'This data is your property and can be imported into compatible systems',
      },
    };

    // Set headers for download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="pokewars-export-${user.name}-${Date.now()}.json"`);

    res.json(exportData);
  } catch (err) {
    console.error('Export user data error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Verify exported data format
 */
exports.verifyExportFormat = async (req, res) => {
  try {
    const { exportData } = req.body;

    if (!exportData || !exportData.version) {
      return res.status(400).json({ 
        valid: false, 
        message: 'Invalid export format' 
      });
    }

    const requiredFields = ['user', 'pokemon', 'stats', 'ranking'];
    const missingFields = requiredFields.filter(field => !exportData[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        valid: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
      });
    }

    res.json({
      valid: true,
      version: exportData.version,
      exportedAt: exportData.exportedAt,
      message: 'Export format is valid',
    });
  } catch (err) {
    console.error('Verify export format error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

