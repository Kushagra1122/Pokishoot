// Leaderboard.jsx (Enhanced)
import React, { useState, useEffect } from 'react';
import { Crown, Trophy, Zap, Skull, Heart } from 'lucide-react';

const Leaderboard = ({ gameState, user, socket }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [liveStats, setLiveStats] = useState(null);

  // Listen for real-time leaderboard updates
  useEffect(() => {
    if (!socket) return;

    const handleLeaderboardUpdate = (data) => {
      setLiveStats(data);
    };

    socket.on('leaderboardUpdate', handleLeaderboardUpdate);

    return () => {
      socket.off('leaderboardUpdate', handleLeaderboardUpdate);
    };
  }, [socket]);

  // Use live stats if available, otherwise fall back to gameState
  const displayPlayers = liveStats || gameState?.players || [];

  const sortedPlayers = displayPlayers.slice().sort((a, b) => {
    const aScore = a.score || a.stats?.score || 0;
    const bScore = b.score || b.stats?.score || 0;
    const aKills = a.kills || a.stats?.kills || 0;
    const bKills = b.kills || b.stats?.kills || 0;
    const aDeaths = a.deaths || a.stats?.deaths || 0;
    const bDeaths = b.deaths || b.stats?.deaths || 0;
    
    if (bScore !== aScore) return bScore - aScore;
    if (bKills !== aKills) return bKills - aKills;
    const aKDRatio = aDeaths === 0 ? aKills : aKills / aDeaths;
    const bKDRatio = bDeaths === 0 ? bKills : bKills / bDeaths;
    if (bKDRatio !== aKDRatio) return bKDRatio - aKDRatio;
    return (b.health || 0) - (a.health || 0);
  });

  const getKDText = (player) => {
    const kills = player.kills !== undefined ? player.kills : (player.stats?.kills || 0);
    const deaths = player.deaths !== undefined ? player.deaths : (player.stats?.deaths || 0);
    return `${kills}/${deaths}`;
  };

  const getKDRatio = (player) => {
    const kills = player.kills !== undefined ? player.kills : (player.stats?.kills || 0);
    const deaths = player.deaths !== undefined ? player.deaths : (player.stats?.deaths || 0);
    if (deaths === 0) return kills === 0 ? '0.00' : kills.toFixed(2);
    return (kills / deaths).toFixed(2);
  };

  const getRankIcon = (index) => {
    if (index === 0) return <Crown className="w-4 h-4 text-yellow-400" />;
    if (index === 1) return <Trophy className="w-4 h-4 text-gray-400" />;
    if (index === 2) return <Zap className="w-4 h-4 text-amber-600" />;
    return <span className="text-xs text-gray-400">#{index + 1}</span>;
  };

  return (
    <div className={`bg-white/5 backdrop-blur-sm border border-white/20 rounded-2xl flex flex-col shadow-2xl transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-80'
    }`}>
      
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors duration-300 rounded-t-2xl"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="font-bold text-white text-lg">Leaderboard</h2>
          </div>
        )}
        <div className={`w-8 h-8 bg-amber-400/20 border border-amber-400/30 rounded-lg flex items-center justify-center transition-transform duration-300 ${
          isCollapsed ? 'rotate-180' : ''
        }`}>
          <span className="text-amber-400 text-sm">▲</span>
        </div>
      </div>

      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto space-y-3 p-4 max-h-80 scrollbar-thin scrollbar-thumb-amber-400/30 scrollbar-track-transparent">
          {sortedPlayers.length > 0 ? (
            sortedPlayers.map((player, idx) => (
              <div key={player.id} className={`p-3 rounded-xl border-2 transition-all duration-300 ${
                player.id === user?.id 
                  ? 'bg-emerald-500/20 border-emerald-400 shadow-lg' 
                  : player.health <= 0
                  ? 'bg-rose-500/20 border-rose-400'
                  : 'bg-white/5 border-white/10'
              }`}>
                {/* Player Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 flex items-center justify-center">
                      {getRankIcon(idx)}
                    </div>
                    <span className={`font-bold ${
                      player.id === user?.id 
                        ? 'text-emerald-400' 
                        : player.health <= 0
                        ? 'text-rose-400'
                        : 'text-white'
                    }`}>
                      {player.name}
                    </span>
                    {player.health <= 0 && (
                      <Skull className="w-3 h-3 text-rose-400" />
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-amber-300">{player.score !== undefined ? player.score : (player.stats?.score || 0)}</div>
                    <div className="text-xs text-gray-400">Score</div>
                  </div>
                </div>
                
                {/* Health Bar */}
                <div className="w-full bg-gray-700/50 rounded-full h-2 overflow-hidden mb-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      player.health > 70 ? 'bg-emerald-500' :
                      player.health > 30 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${player.health || 0}%` }}
                  ></div>
                </div>
                
                {/* Stats */}
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-gray-300">
                      <Heart className="w-3 h-3" />
                      {player.health || 0}%
                    </div>
                    <div className="text-gray-300">
                      K/D: {getKDText(player)}
                    </div>
                  </div>
                  <div className="text-amber-400 font-semibold">
                    Ratio: {getKDRatio(player)}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No players yet</p>
              <p className="text-gray-500 text-xs mt-1">Waiting for players to join...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Leaderboard;