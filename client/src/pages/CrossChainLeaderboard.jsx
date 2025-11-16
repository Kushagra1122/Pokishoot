import React, { useState, useEffect } from 'react';
import { Trophy, Network, TrendingUp, Users, Award } from 'lucide-react';
import crossChainService from '../services/crossChainService';

const CrossChainLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [count, setCount] = useState(10);

  useEffect(() => {
    fetchLeaderboard();
  }, [count]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await crossChainService.getCrossChainLeaderboard(count);
      setLeaderboard(data);
    } catch (err) {
      console.error('Error fetching cross-chain leaderboard:', err);
      setError(err.message || 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-400" />;
    if (rank === 2) return <Award className="w-6 h-6 text-gray-300" />;
    if (rank === 3) return <Award className="w-6 h-6 text-amber-600" />;
    return <span className="text-gray-400 font-bold">#{rank}</span>;
  };

  const getTierColor = (elo) => {
    if (elo >= 2000) return 'text-purple-400 border-purple-400';
    if (elo >= 1800) return 'text-blue-400 border-blue-400';
    if (elo >= 1600) return 'text-green-400 border-green-400';
    if (elo >= 1400) return 'text-yellow-400 border-yellow-400';
    if (elo >= 1200) return 'text-orange-400 border-orange-400';
    return 'text-gray-400 border-gray-400';
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Network className="w-8 h-8 text-purple-400" />
            <div>
              <h1 className="text-4xl font-bold text-purple-400" style={{ fontFamily: 'monospace' }}>
                CROSS-CHAIN LEADERBOARD
              </h1>
              <p className="text-gray-400 mt-2">
                Aggregated rankings from {leaderboard?.chains?.length || 0} chains
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="text-gray-400">Show Top:</label>
            <select
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="px-4 py-2 bg-gray-900 border-2 border-purple-400 text-purple-400 font-bold rounded"
              style={{ fontFamily: 'monospace' }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent animate-spin mb-4"></div>
            <div className="text-xl text-purple-400 font-bold" style={{ fontFamily: 'monospace' }}>
              LOADING CROSS-CHAIN DATA...
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-900 border-4 border-red-500 text-red-400 p-6 text-center font-bold rounded-lg mb-8" style={{ fontFamily: 'monospace' }}>
            ⚠ {error}
          </div>
        )}

        {/* Leaderboard */}
        {!loading && !error && leaderboard && (
          <div className="space-y-4">
            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-gradient-to-br from-purple-500/10 to-purple-400/5 border-2 border-purple-400/30 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="w-6 h-6 text-purple-400" />
                  <span className="text-gray-400">Total Players</span>
                </div>
                <div className="text-3xl font-bold text-purple-400">{leaderboard.total}</div>
              </div>
              <div className="bg-gradient-to-br from-purple-500/10 to-purple-400/5 border-2 border-purple-400/30 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Network className="w-6 h-6 text-purple-400" />
                  <span className="text-gray-400">Active Chains</span>
                </div>
                <div className="text-3xl font-bold text-purple-400">{leaderboard.chains?.length || 0}</div>
              </div>
              <div className="bg-gradient-to-br from-purple-500/10 to-purple-400/5 border-2 border-purple-400/30 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-6 h-6 text-purple-400" />
                  <span className="text-gray-400">Top ELO</span>
                </div>
                <div className="text-3xl font-bold text-purple-400">
                  {leaderboard.players?.[0]?.elo || 0}
                </div>
              </div>
            </div>

            {/* Player List */}
            {leaderboard.players && leaderboard.players.length > 0 ? (
              <div className="space-y-3">
                {leaderboard.players.map((player, index) => (
                  <div
                    key={player.player}
                    className="bg-gradient-to-r from-purple-500/10 to-purple-400/5 border-2 border-purple-400/30 rounded-xl p-6 hover:border-purple-400/60 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      {/* Rank & Player */}
                      <div className="flex items-center gap-6">
                        <div className="w-12 h-12 flex items-center justify-center">
                          {getRankIcon(index + 1)}
                        </div>
                        <div>
                          <div className="text-lg font-bold text-white">
                            {player.player.slice(0, 6)}...{player.player.slice(-4)}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {player.chains?.map((chain) => (
                              <span
                                key={chain}
                                className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded"
                              >
                                {chain}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-8">
                        <div className="text-center">
                          <div className={`text-2xl font-bold ${getTierColor(player.elo)}`}>
                            {player.elo}
                          </div>
                          <div className="text-xs text-gray-400">ELO</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-white">
                            {player.matchesWon}/{player.matchesPlayed}
                          </div>
                          <div className="text-xs text-gray-400">Wins/Total</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-white">{player.totalKills}</div>
                          <div className="text-xs text-gray-400">Kills</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-white">
                            {Math.round(player.totalDamage / 1000)}K
                          </div>
                          <div className="text-xs text-gray-400">Damage</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No players found. Be the first to compete!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CrossChainLeaderboard;

