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
      <div className="min-h-screen flex items-center justify-center bg-black" style={{
        backgroundImage: `linear-gradient(#0a0a0a 1px, transparent 1px),
                          linear-gradient(90deg, #0a0a0a 1px, transparent 1px)`,
        backgroundSize: '32px 32px',
        backgroundColor: '#000'
      }}>
        <div className="text-center">
          <div className="w-20 h-20 bg-yellow-400 mx-auto mb-6 animate-pulse" style={{
            clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)'
          }}></div>
          <p className="text-2xl font-black text-yellow-400 uppercase" style={{ fontFamily: 'monospace' }}>LOADING...</p>
          <p className="text-gray-400 mt-2 font-black uppercase" style={{ fontFamily: 'monospace' }}>CODE: {code}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-6" style={{
      backgroundImage: `linear-gradient(#0a0a0a 1px, transparent 1px),
                        linear-gradient(90deg, #0a0a0a 1px, transparent 1px)`,
      backgroundSize: '32px 32px',
      backgroundColor: '#000'
    }}>
      {/* Subtle Animated Background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-20 h-20 bg-yellow-400" style={{
          clipPath: 'polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)',
          filter: 'blur(20px)'
        }}></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-blue-400" style={{
          clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
          filter: 'blur(20px)'
        }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-black mb-2" style={{
              fontFamily: 'monospace',
              color: '#fbbf24',
              textShadow: '2px 2px 0 #dc2626'
            }}>
              BATTLE <span className="text-red-500">LOBBY</span>
            </h1>
            <p className="text-yellow-400 font-black uppercase" style={{ fontFamily: 'monospace' }}>&gt; PREPARE_FOR_BATTLE.EXE</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Lobby Code */}
            <div className="flex items-center gap-3 bg-gray-900 border-4 border-yellow-400 px-4 py-3" style={{ fontFamily: 'monospace', boxShadow: '0 8px 0 #92400e' }}>
              <div className="text-right">
                <div className="text-xs text-yellow-400 font-black uppercase">LOBBY CODE</div>
                <div className="text-2xl font-black text-white tracking-widest">{code}</div>
              </div>
              <button
                onClick={handleCopyCode}
                className="p-2 bg-yellow-400 border-2 border-yellow-600 hover:bg-yellow-300 transition-all duration-300"
                title="Copy code"
                style={{ boxShadow: '0 4px 0 #d97706' }}
              >
                {copied ? <Check className="w-4 h-4 text-black" strokeWidth={3} /> : <Copy className="w-4 h-4 text-black" strokeWidth={3} />}
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Players & Chat */}
          <div className="lg:col-span-2 space-y-6">
            {/* Players List */}
            <div className="bg-gray-900 border-4 border-yellow-400 p-6" style={{ fontFamily: 'monospace', boxShadow: '0 8px 0 #92400e' }}>
              <div className="flex items-center gap-3 mb-6">
                <Users className="w-6 h-6 text-yellow-400" strokeWidth={3} />
                <h2 className="text-xl font-black text-white uppercase">Players ({lobby.players.length}/8)</h2>
              </div>
              <PlayersList
                lobby={lobby}
                isOwner={isOwner}
                currentUserId={user.id}
              />
            </div>

            {/* Chat Box */}
            <div className="bg-gray-900 border-4 border-yellow-400 p-6" style={{ fontFamily: 'monospace', boxShadow: '0 8px 0 #92400e' }}>
              <div className="flex items-center gap-3 mb-6">
                <MessageCircle className="w-6 h-6 text-yellow-400" strokeWidth={3} />
                <h2 className="text-xl font-black text-white uppercase">Battle Chat</h2>
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
            <div className="bg-gray-900 border-4 border-yellow-400 p-6 sticky top-6" style={{ fontFamily: 'monospace', boxShadow: '0 8px 0 #92400e' }}>
              <div className="flex items-center gap-3 mb-6">
                <Settings className="w-6 h-6 text-yellow-400" strokeWidth={3} />
                <h2 className="text-xl font-black text-white uppercase">Settings</h2>
                {isOwner && (
                  <span className="px-2 py-1 bg-yellow-400 text-black text-xs font-black uppercase border-2 border-yellow-600">
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
                  className="w-full mt-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-black font-black border-4 border-green-700 hover:border-green-400 transition-all duration-300 flex items-center justify-center gap-3 uppercase"
                  style={{ fontFamily: 'monospace', boxShadow: '0 8px 0 #166534' }}
                >
                  <Play className="w-5 h-5" strokeWidth={3} />
                  Start Battle
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-6 p-4 bg-gray-900 border-4 border-red-500 text-red-400 text-center font-black uppercase animate-pulse" style={{ fontFamily: 'monospace' }}>
            ❌ {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default Waiting;