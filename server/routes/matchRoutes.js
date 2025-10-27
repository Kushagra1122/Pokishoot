const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * Get match history for authenticated user
 * GET /api/matches/history
 */
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const matches = await matchController.getUserMatchHistory(req.user.id, limit);
    res.json({ matches });
  } catch (error) {
    console.error('Error fetching match history:', error);
    res.status(500).json({ message: 'Error fetching match history' });
  }
});

/**
 * Get match details
 * GET /api/matches/:matchId
 */
router.get('/:matchId', authMiddleware, async (req, res) => {
  try {
    const match = await matchController.getMatchDetails(req.params.matchId);
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }
    res.json({ match });
  } catch (error) {
    console.error('Error fetching match details:', error);
    res.status(500).json({ message: 'Error fetching match details' });
  }
});

/**
 * Get leaderboard
 * GET /api/matches/leaderboard
 */
router.get('/leaderboard/top', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const leaderboard = await matchController.getLeaderboard(limit);
    res.json({ leaderboard });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ message: 'Error fetching leaderboard' });
  }
});

module.exports = router;

