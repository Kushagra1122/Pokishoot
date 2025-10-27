// Waiting.jsx
import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import AuthContext from '../context/AuthContext';
import PlayersList from '../components/Waiting/PlayerList.jsx';
import ChatBox from '../components/Waiting/ChatBox.jsx';
import GameSettings from '../components/Waiting/GameSettings.jsx';
import { Copy, Check, Users, MessageCircle, Settings, Play } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';
let socket;

const Waiting = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const { user, selectedPokemon } = useContext(AuthContext);

  const [lobby, setLobby] = useState(null);
  const [joined, setJoined] = useState(false);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState('');
  const [gameSettings, setGameSettings] = useState({
    gameTime: '',
    map: '',
    gameType: '',
    stake: '',
  });

  const [copied, setCopied] = useState(false);
  const isOwner = lobby?.ownerId === user?.id;

  useEffect(() => {
    if (!socket) {
      socket = io(API_BASE, { transports: ['websocket', 'polling'] });
    }

    socket.on('connect', () => console.log('✅ Connected:', socket.id));
    socket.on('disconnect', (reason) => console.log('🔌 Disconnected:', reason));
    socket.on('lobbyData', (data) => {
      setLobby(data);
      setGameSettings(data.gameSettings || {});
    });
    socket.on('lobbyUpdate', (data) => {
      setLobby(data);
      setGameSettings(data.gameSettings || {});
    });
    socket.on('message', (msg) => setMessages((prev) => [...prev, msg]));
    socket.on('lobbyError', (msg) => setError(msg));
    socket.on('gameStarting', () => navigate(`/battle/game/${code}`));

    return () => {
      socket.off('lobbyData');
      socket.off('lobbyUpdate');
      socket.off('message');
      socket.off('lobbyError');
      socket.off('gameStarting');
    };
  }, [code, navigate]);

  useEffect(() => {
    if (!joined && user?.id && user?.name) {
      socket.emit('joinLobby', {
        code,
        playerName: user.name,
        playerId: user.id,
        selectedPokemonDetails: selectedPokemon || null,
      });
      setJoined(true);
    }
  }, [joined, user, code, selectedPokemon]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!lobby) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-blue-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-white font-semibold">Loading Battle Lobby...</p>
          <p className="text-gray-400 mt-2">Code: {code}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-blue-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white mb-2">
              Battle <span className="bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">Lobby</span>
            </h1>
            <p className="text-gray-400">Prepare for battle and configure your game settings</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Lobby Code */}
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3">
              <div className="text-right">
                <div className="text-xs text-gray-400 font-semibold">LOBBY CODE</div>
                <div className="text-xl font-bold text-white tracking-widest">{code}</div>
              </div>
              <button
                onClick={handleCopyCode}
                className="p-2 bg-amber-400 text-slate-900 rounded-xl hover:scale-110 transition-transform duration-300"
                title="Copy code"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Players & Chat */}
          <div className="lg:col-span-2 space-y-6">
            {/* Players List */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <Users className="w-6 h-6 text-amber-400" />
                <h2 className="text-xl font-bold text-white">Players ({lobby.players.length}/8)</h2>
              </div>
              <PlayersList
                lobby={lobby}
                isOwner={isOwner}
                currentUserId={user.id}
              />
            </div>

            {/* Chat Box */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <MessageCircle className="w-6 h-6 text-blue-400" />
                <h2 className="text-xl font-bold text-white">Battle Chat</h2>
              </div>
              <ChatBox
                messages={messages}
                setMessage={(msg) =>
                  socket.emit('sendMessage', {
                    code,
                    message: `${user.name}: ${msg}`,
                  })
                }
              />
            </div>
          </div>

          {/* Right Column - Settings */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6 sticky top-6">
              <div className="flex items-center gap-3 mb-6">
                <Settings className="w-6 h-6 text-purple-400" />
                <h2 className="text-xl font-bold text-white">Game Settings</h2>
                {isOwner && (
                  <span className="px-2 py-1 bg-amber-400/20 text-amber-400 text-xs font-bold rounded-full">
                    HOST
                  </span>
                )}
              </div>
              
              <GameSettings
                lobby={lobby}
                isOwner={isOwner}
                gameSettings={gameSettings}
                setGameSettings={setGameSettings}
                onUpdateSettings={(updated) => {
                  socket.emit('updateGameSettings', {
                    code,
                    settings: updated,
                  });
                }}
                onStartGame={() => {
                  if (lobby.players.length < 2)
                    return setError('Need at least 2 players to start');
                  const required = ['gameTime', 'map', 'gameType'];
                  const missing = required.filter((k) => !gameSettings[k]);
                  if (missing.length)
                    return setError(`Please set: ${missing.join(', ')}`);
                  if (
                    gameSettings.gameType === 'rated' &&
                    (!gameSettings.stake || gameSettings.stake <= 0)
                  )
                    return setError('Set valid stake for rated battle');
                  socket.emit('startGame', { code });
                }}
                onLeaveLobby={() => {
                  socket.emit('leaveLobby', { code, playerId: user.id });
                  navigate('/battle');
                }}
              />

              {/* Start Game Button */}
              {isOwner && (
                <button
                  onClick={() => {
                    if (lobby.players.length < 2)
                      return setError('Need at least 2 players to start');
                    const required = ['gameTime', 'map', 'gameType'];
                    const missing = required.filter((k) => !gameSettings[k]);
                    if (missing.length)
                      return setError(`Please set: ${missing.join(', ')}`);
                    socket.emit('startGame', { code });
                  }}
                  className="w-full mt-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-2xl hover:scale-105 shadow-2xl transition-all duration-300 flex items-center justify-center gap-3"
                >
                  <Play className="w-5 h-5" />
                  Start Battle
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-6 p-4 bg-rose-500/20 border border-rose-500/30 rounded-2xl text-rose-400 text-center font-semibold animate-pulse">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default Waiting;