// GameOver.jsx (Enhanced)
import React from 'react';
import { Trophy, Star, RotateCcw, Home, Crown, Target, Zap, Award, Users, TrendingUp } from 'lucide-react';

const GameOver = ({ gameState, user, onPlayAgain, onReturnHome }) => {
  if (!gameState?.result) return null;

  const isWinner = gameState.result.winner === user?.id;
  const isDraw = !gameState.result.winner;
  const winner = gameState.players.find(p => p.id === gameState.result.winner);
  const finalRankings = gameState.result.finalRankings || [];
  const userRanking = finalRankings.find(r => r.id === user?.id);

  const getResultConfig = () => {
    if (isWinner) return {
      icon: Crown,
      title: 'VICTORY!',
      color: 'text-yellow-400',
      bg: 'from-yellow-400/20 to-yellow-600/20 border-yellow-400',
      message: 'Congratulations on your outstanding victory!'
    };
    if (isDraw) return {
      icon: Target,
      title: 'DRAW!',
      color: 'text-blue-400',
      bg: 'from-blue-400/20 to-blue-600/20 border-blue-400',
      message: 'It was an intense and evenly matched battle!'
    };
    return {
      icon: Zap,
      title: 'DEFEAT',
      color: 'text-rose-400',
      bg: 'from-rose-400/20 to-rose-600/20 border-rose-400',
      message: 'Better luck next time! Learn from this experience.'
    };
  };

  const resultConfig = getResultConfig();
  const ResultIcon = resultConfig.icon;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 backdrop-blur-sm p-6">
      <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-blue-900 border-2 border-amber-400 rounded-3xl p-8 max-w-4xl w-full shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-2xl">
            <ResultIcon className="w-10 h-10 text-white" />
          </div>
          <h1 className={`text-4xl md:text-6xl font-black ${resultConfig.color} mb-4`}>
            {resultConfig.title}
          </h1>
          <p className="text-gray-300 text-lg">
            {resultConfig.message}
          </p>
        </div>

        {/* Final Rankings */}
        <div className={`bg-gradient-to-r ${resultConfig.bg} rounded-2xl p-6 mb-8`}>
          <h2 className="text-2xl font-bold text-white mb-6 text-center flex items-center justify-center gap-3">
            <Trophy className="w-6 h-6 text-amber-400" />
            Final Rankings
          </h2>
          
          {finalRankings.length > 0 ? (
            <div className="space-y-4">
              {finalRankings.map((player, index) => (
                <div key={player.id} className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                  player.id === user?.id 
                    ? 'bg-emerald-500/20 border-emerald-400 shadow-lg scale-105' 
                    : index === 0
                    ? 'bg-yellow-500/20 border-yellow-400'
                    : 'bg-white/5 border-white/10'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-xl font-bold text-sm ${
                        index === 0 ? 'bg-yellow-400 text-slate-900' :
                        index === 1 ? 'bg-gray-400 text-slate-900' :
                        index === 2 ? 'bg-amber-700 text-white' :
                        'bg-slate-700 text-white'
                      }`}>
                        {player.rank}
                      </div>
                      <div>
                        <div className={`font-bold text-lg ${
                          player.id === user?.id 
                            ? 'text-emerald-400' 
                            : index === 0
                            ? 'text-yellow-400'
                            : 'text-white'
                        }`}>
                          {player.name}
                          {player.id === user?.id && (
                            <span className="ml-2 text-emerald-300 text-sm">(You)</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-300">
                          K/D: {player.kills}/{player.deaths} • Ratio: {player.kdRatio}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {player.assists ? `Assists: ${player.assists} • ` : ''}
                          {player.damageDealt ? `Dmg: ${player.damageDealt} • ` : ''}
                          {player.survivalTime ? `Survived: ${player.survivalTime}s` : ''}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-amber-300">
                        {player.score}
                      </div>
                      <div className="text-sm text-gray-300">Score</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Award className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <div className="text-gray-400">No rankings available</div>
            </div>
          )}
        </div>

        {/* Game Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
            <div className="text-2xl font-bold text-amber-400">{gameState.settings?.gameTime || 0}</div>
            <div className="text-sm text-gray-400">Minutes</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
            <div className="text-2xl font-bold text-amber-400">{gameState.settings?.map || 'Unknown'}</div>
            <div className="text-sm text-gray-400">Map</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
            <div className="text-2xl font-bold text-amber-400">
              {gameState.settings?.gameType === 'rated' ? 'Rated' : 'Friendly'}
            </div>
            <div className="text-sm text-gray-400">Type</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
            <div className="text-2xl font-bold text-amber-400">
              {gameState.settings?.stake ? `${gameState.settings.stake} ETH` : 'Free'}
            </div>
            <div className="text-sm text-gray-400">Stake</div>
          </div>
        </div>

        {/* Winner Announcement */}
        {winner && (
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 bg-amber-400/20 border border-amber-400 rounded-xl px-6 py-3">
              <Trophy className="w-6 h-6 text-amber-400" />
              <span className="text-amber-400 font-bold text-lg">
                {winner.name} wins the match!
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row gap-4">
          <button
            onClick={onPlayAgain}
            className="flex-1 flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold rounded-xl hover:scale-105 shadow-2xl transition-all duration-300"
          >
            <RotateCcw className="w-5 h-5" />
            Battle Again
          </button>
          <button
            onClick={onReturnHome}
            className="flex-1 flex items-center justify-center gap-3 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-bold rounded-xl hover:bg-white/20 hover:scale-105 shadow-2xl transition-all duration-300"
          >
            <Home className="w-5 h-5" />
            Return to Base
          </button>
        </div>

        {/* Additional Info */}
        {gameState.settings?.gameType === 'rated' && (
          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-2 text-amber-400 text-sm">
              <TrendingUp className="w-4 h-4" />
              This was a rated match. Your ranking has been updated.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameOver;