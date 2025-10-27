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
    <div className={`bg-gray-900 border-4 border-yellow-400 flex flex-col transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-80'
    }`} style={{ fontFamily: 'monospace', boxShadow: '0 8px 0 #92400e' }}>
      
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-800 transition-colors duration-300 bg-gray-950"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-400" strokeWidth={3} />
            <h2 className="font-black text-white text-lg uppercase">Scoreboard</h2>
          </div>
        )}
        <div className={`w-10 h-10 bg-yellow-400 border-2 border-yellow-600 flex items-center justify-center ${
          isCollapsed ? 'rotate-180' : ''
        }`} style={{ clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)' }}>
          <span className="text-black text-lg font-black">▲</span>
        </div>
      </div>

      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto space-y-2 p-4 max-h-80 bg-gray-950">
          {sortedPlayers.length > 0 ? (
            sortedPlayers.map((player, idx) => (
              <div key={player.id} className={`p-3 border-4 transition-all duration-300 ${
                player.id === user?.id 
                  ? 'border-emerald-400 bg-emerald-500/10' 
                  : player.health <= 0
                  ? 'border-rose-400 bg-rose-500/10'
                  : 'border-gray-600 bg-gray-900'
              }`}>
                {/* Player Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 flex items-center justify-center border-2 border-yellow-400 bg-yellow-400/20">
                      {getRankIcon(idx)}
                    </div>
                    <span className={`font-black text-sm ${
                      player.id === user?.id 
                        ? 'text-emerald-400' 
                        : player.health <= 0
                        ? 'text-rose-400'
                        : 'text-white'
                    }`} style={{ fontFamily: 'monospace' }}>
                      {player.name.toUpperCase()}
                    </span>
                    {player.health <= 0 && (
                      <Skull className="w-4 h-4 text-rose-400" strokeWidth={3} />
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-black text-yellow-400" style={{ fontFamily: 'monospace' }}>{player.score !== undefined ? player.score : (player.stats?.score || 0)}</div>
                    <div className="text-xs text-gray-400 font-black">SCORE</div>
                  </div>
                </div>
                
                {/* Health Bar */}
                <div className="w-full bg-gray-800 h-3 overflow-hidden mb-2 border-2 border-gray-700">
                  <div
                    className={`h-full transition-all duration-500 ${
                      player.health > 70 ? 'bg-emerald-500' :
                      player.health > 30 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${player.health || 0}%` }}
                  ></div>
                </div>
                
                {/* Stats */}
                <div className="flex justify-between items-center text-xs font-black">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-gray-300">
                      <Heart className="w-3 h-3" strokeWidth={3} />
                      {player.health || 0}%
                    </div>
                    <div className="text-gray-300">
                      K/D: {getKDText(player)}
                    </div>
                  </div>
                  <div className="text-yellow-400">
                    RATIO: {getKDRatio(player)}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-3" strokeWidth={3} />
              <p className="text-gray-400 text-sm font-black" style={{ fontFamily: 'monospace' }}>NO PLAYERS</p>
              <p className="text-gray-500 text-xs mt-1 font-black" style={{ fontFamily: 'monospace' }}>WAITING...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Leaderboard;