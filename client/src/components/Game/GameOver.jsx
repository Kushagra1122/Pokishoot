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
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-6">
      <div className="bg-gray-900 border-4 border-yellow-400 p-8 max-w-4xl w-full" style={{ fontFamily: 'monospace', boxShadow: '0 12px 0 #92400e' }}>
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-amber-600 mx-auto mb-6 flex items-center justify-center" style={{
            clipPath: 'polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)',
            boxShadow: '0 8px 0 #d97706'
          }}>
            <ResultIcon className="w-12 h-12 text-black" strokeWidth={3} />
          </div>
          <h1 className={`text-5xl md:text-7xl font-black mb-4 ${resultConfig.color}`} style={{
            fontFamily: 'monospace',
            textShadow: '3px 3px 0 #000'
          }}>
            {resultConfig.title}
          </h1>
          <p className="text-yellow-400 text-lg font-black uppercase" style={{ fontFamily: 'monospace' }}>
            {resultConfig.message}
          </p>
        </div>

        {/* Final Rankings */}
        <div className="bg-gray-950 border-4 border-yellow-400 p-6 mb-8">
          <h2 className="text-2xl font-black text-white mb-6 text-center flex items-center justify-center gap-3 uppercase" style={{ fontFamily: 'monospace' }}>
            <Trophy className="w-6 h-6 text-yellow-400" strokeWidth={3} />
            Final Rankings
          </h2>
          
          {finalRankings.length > 0 ? (
            <div className="space-y-3">
              {finalRankings.map((player, index) => (
                <div key={player.id} className={`p-4 border-4 transition-all duration-300 ${
                  player.id === user?.id 
                    ? 'border-emerald-400 bg-emerald-500/10' 
                    : index === 0
                    ? 'border-yellow-400 bg-yellow-500/10'
                    : 'border-gray-600 bg-gray-900'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`flex items-center justify-center w-12 h-12 border-2 font-black uppercase text-sm ${
                        index === 0 ? 'bg-yellow-400 text-black border-yellow-600' :
                        index === 1 ? 'bg-gray-400 text-black border-gray-600' :
                        index === 2 ? 'bg-amber-700 text-white border-amber-800' :
                        'bg-gray-700 text-white border-gray-800'
                      }`} style={{ fontFamily: 'monospace' }}>
                        {player.rank}
                      </div>
                      <div>
                        <div className={`font-black text-lg uppercase ${
                          player.id === user?.id 
                            ? 'text-emerald-400' 
                            : index === 0
                            ? 'text-yellow-400'
                            : 'text-white'
                        }`} style={{ fontFamily: 'monospace' }}>
                          {player.name.toUpperCase()}
                          {player.id === user?.id && (
                            <span className="ml-2 text-emerald-300 text-sm">(YOU)</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-300 font-black uppercase" style={{ fontFamily: 'monospace' }}>
                          K/D: {player.kills}/{player.deaths} | RATIO: {player.kdRatio}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-yellow-400" style={{ fontFamily: 'monospace' }}>
                        {player.score}
                      </div>
                      <div className="text-xs text-gray-400 font-black uppercase">SCORE</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Award className="w-12 h-12 text-gray-400 mx-auto mb-3" strokeWidth={3} />
              <div className="text-gray-400 font-black uppercase" style={{ fontFamily: 'monospace' }}>NO RANKINGS</div>
            </div>
          )}
        </div>

        {/* Game Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-950 border-4 border-gray-700 p-4 text-center">
            <div className="text-2xl font-black text-yellow-400" style={{ fontFamily: 'monospace' }}>{gameState.settings?.gameTime || 0}</div>
            <div className="text-xs text-gray-400 font-black uppercase" style={{ fontFamily: 'monospace' }}>Minutes</div>
          </div>
          <div className="bg-gray-950 border-4 border-gray-700 p-4 text-center">
            <div className="text-2xl font-black text-yellow-400 uppercase" style={{ fontFamily: 'monospace' }}>{gameState.settings?.map || 'Unknown'}</div>
            <div className="text-xs text-gray-400 font-black uppercase" style={{ fontFamily: 'monospace' }}>Map</div>
          </div>
          <div className="bg-gray-950 border-4 border-gray-700 p-4 text-center">
            <div className="text-2xl font-black text-yellow-400 uppercase" style={{ fontFamily: 'monospace' }}>
              {gameState.settings?.gameType === 'rated' ? 'Rated' : 'Friendly'}
            </div>
            <div className="text-xs text-gray-400 font-black uppercase" style={{ fontFamily: 'monospace' }}>Type</div>
          </div>
          <div className="bg-gray-950 border-4 border-gray-700 p-4 text-center">
            <div className="text-2xl font-black text-yellow-400" style={{ fontFamily: 'monospace' }}>
              {gameState.settings?.stake ? `${gameState.settings.stake} ETH` : 'Free'}
            </div>
            <div className="text-xs text-gray-400 font-black uppercase" style={{ fontFamily: 'monospace' }}>Stake</div>
          </div>
        </div>

        {/* Winner Announcement */}
        {winner && (
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 bg-yellow-400/20 border-4 border-yellow-400 px-6 py-3">
              <Trophy className="w-6 h-6 text-yellow-400" strokeWidth={3} />
              <span className="text-yellow-400 font-black text-lg uppercase" style={{ fontFamily: 'monospace' }}>
                {winner.name.toUpperCase()} WINS!
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row gap-4">
          <button
            onClick={onPlayAgain}
            className="flex-1 flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-black font-black border-4 border-green-700 hover:border-green-400 transition-all duration-300 uppercase"
            style={{ fontFamily: 'monospace', boxShadow: '0 8px 0 #166534' }}
          >
            <RotateCcw className="w-5 h-5" strokeWidth={3} />
            Battle Again
          </button>
          <button
            onClick={onReturnHome}
            className="flex-1 flex items-center justify-center gap-3 py-4 bg-gray-900 border-4 border-gray-700 hover:border-yellow-400 text-white font-black transition-all duration-300 uppercase"
            style={{ fontFamily: 'monospace', boxShadow: '0 8px 0 #000' }}
          >
            <Home className="w-5 h-5" strokeWidth={3} />
            Return to Base
          </button>
        </div>

        {/* Additional Info */}
        {gameState.settings?.gameType === 'rated' && (
          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-2 text-yellow-400 text-sm font-black uppercase" style={{ fontFamily: 'monospace' }}>
              <TrendingUp className="w-4 h-4" strokeWidth={3} />
              RATED MATCH - RANKING UPDATED
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameOver;