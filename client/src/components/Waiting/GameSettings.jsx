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
    <div className="bg-yellow-400/10 border border-yellow-400 rounded-xl p-6">
      <h2 className="text-yellow-200 font-bold mb-4">
        Game Settings {isOwner && '(Owner)'}
      </h2>

      {/* Game Time */}
      <label className="block text-yellow-200 mb-2">Game Time</label>
      <select
        value={gameSettings.gameTime || ''}
        onChange={(e) => handleUpdate('gameTime', e.target.value)}
        disabled={!isOwner}
        className="w-full mb-4 p-2 rounded-lg bg-yellow-400/20 border border-yellow-400 text-blue-900"
      >
        <option value="">Select...</option>
        <option value="3">3 minutes</option>
        <option value="5">5 minutes</option>
        <option value="10">10 minutes</option>
      </select>

      {/* Map Selection */}
      <label className="block text-yellow-200 mb-2">Map</label>
      <select
        value={gameSettings.map || ''}
        onChange={(e) => handleUpdate('map', e.target.value)}
        disabled={!isOwner}
        className="w-full mb-4 p-2 rounded-lg bg-yellow-400/20 border border-yellow-400 text-blue-900"
      >
        <option value="">Select...</option>
        <option value="forest">Forest</option>
        <option value="snow">Snow</option>
        <option value="volcano">Volcano</option>
        <option value="desert">Desert</option>
      </select>

      {/* Game Type */}
      <div className="flex gap-4 mb-4">
        {['friendly', 'rated'].map((type) => (
          <button
            key={type}
            onClick={() => handleUpdate('gameType', type)}
            disabled={!isOwner}
            className={`flex-1 py-2 rounded-xl font-bold transition ${
              gameSettings.gameType === type
                ? type === 'friendly'
                  ? 'bg-green-500 text-white'
                  : 'bg-red-500 text-white'
                : 'bg-yellow-400/20 text-yellow-200 border border-yellow-400'
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Buttons */}
      <div className="flex gap-4">
        <button
          onClick={onLeaveLobby}
          className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-400"
        >
          Leave
        </button>
        {isOwner && (
          <button
            onClick={onStartGame}
            className="w-full flex-1 py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-400"
          >
            Start
          </button>
        )}
      </div>
    </div>
  );
};

export default GameSettings;
