import React, { useState } from 'react';

const GameSettings = ({
  lobby,
  isOwner,
  gameSettings,
  setGameSettings,
  onStartGame,
  onLeaveLobby,
  onUpdateSettings, // 👈 new prop from parent
}) => {

  const handleUpdate = (key, value) => {
    if (!isOwner) return;
    const updated = { ...gameSettings, [key]: value };
    setGameSettings(updated);
    onUpdateSettings(updated); // 👈 notify parent to emit
  };

  const isRated = gameSettings.gameType === 'rated';

  return (
    <div className="bg-gray-950">
      <div className="space-y-4">
        {/* Game Time */}
        <div>
          <label className="block text-yellow-400 mb-2 font-black uppercase text-xs" style={{ fontFamily: 'monospace' }}>Game Time</label>
          <select
            value={gameSettings.gameTime || ''}
            onChange={(e) => handleUpdate('gameTime', e.target.value)}
            disabled={!isOwner}
            className="w-full p-3 bg-gray-900 border-2 border-gray-700 text-white font-black uppercase focus:outline-none focus:border-yellow-400 disabled:opacity-50"
            style={{ fontFamily: 'monospace' }}
          >
            <option value="">Select...</option>
            <option value="1">1 minute</option>
            <option value="3">3 minutes</option>
            <option value="5">5 minutes</option>
            <option value="10">10 minutes</option>
          </select>
        </div>

        {/* Map Selection */}
        <div>
          <label className="block text-yellow-400 mb-2 font-black uppercase text-xs" style={{ fontFamily: 'monospace' }}>Map</label>
          <select
            value={gameSettings.map || ''}
            onChange={(e) => handleUpdate('map', e.target.value)}
            disabled={!isOwner}
            className="w-full p-3 bg-gray-900 border-2 border-gray-700 text-white font-black uppercase focus:outline-none focus:border-yellow-400 disabled:opacity-50"
            style={{ fontFamily: 'monospace' }}
          >
            <option value="">Select...</option>
            <option value="forest">Forest</option>
            <option value="snow">Snow</option>
            <option value="volcano">Volcano</option>
            <option value="desert">Desert</option>
          </select>
        </div>

        {/* Game Type */}
        <div className="flex gap-2">
          {['friendly', 'rated'].map((type) => (
            <button
              key={type}
              onClick={() => handleUpdate('gameType', type)}
              disabled={!isOwner}
              className={`flex-1 py-3 font-black uppercase border-2 transition ${
                gameSettings.gameType === type
                  ? type === 'friendly'
                    ? 'bg-green-500 text-black border-green-700'
                    : 'bg-red-500 text-black border-red-700'
                  : 'bg-gray-900 text-gray-400 border-gray-700'
              } disabled:opacity-50`}
              style={{ fontFamily: 'monospace', boxShadow: gameSettings.gameType === type ? '0 4px 0 #166534' : '' }}
            >
              {type.toUpperCase()}
            </button>
          ))}
        </div>

        {isRated && (
          <div>
            <label className="block text-yellow-400 mb-2 font-black uppercase text-xs" style={{ fontFamily: 'monospace' }}>Stake (GLMR)</label>
            <input
              type="number"
              value={gameSettings.stake || ''}
              onChange={(e) => handleUpdate('stake', e.target.value)}
              disabled={!isOwner}
              placeholder="0.0"
              className="w-full p-3 bg-gray-900 border-2 border-gray-700 text-white font-black uppercase focus:outline-none focus:border-yellow-400 disabled:opacity-50"
              style={{ fontFamily: 'monospace' }}
            />
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-2 pt-4">
          <button
            onClick={onLeaveLobby}
            className="flex-1 py-3 bg-red-500 text-black font-black border-2 border-red-700 hover:border-red-400 transition uppercase"
            style={{ fontFamily: 'monospace', boxShadow: '0 4px 0 #991b1b' }}
          >
            Leave
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameSettings;
