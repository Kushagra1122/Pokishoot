import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import AuthContext from '../context/AuthContext';
import { Plus, LogIn, Zap, Home } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';
let socket;

const Battle = () => {
  const navigate = useNavigate();
  const [lobbyCode, setLobbyCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const { user, selectedPokemon } = useContext(AuthContext);
  useEffect(() => {
    if (!socket) {
      socket = io(API_BASE, { transports: ['websocket', 'polling'] });
      console.log('🔌 Socket connected to:', API_BASE);
    }

    socket.on('connect', () => console.log('✅ Socket connected:', socket.id));
    socket.on('disconnect', (reason) =>
      console.log('🔌 Socket disconnected:', reason),
    );
    socket.on('lobbyError', (msg) => {
      console.log('❌ Lobby error:', msg);
      setError(msg);
    });

    return () => {
      socket.off('lobbyError');
      socket.off('connect');
      socket.off('disconnect');
    };
  }, [user]);

  const handleCreateLobby = async () => {
    if (!user) return setError('Please log in first!');
    setCreating(true);
    setError('');

    try {
      console.log('📝 Creating lobby for:', user.name);

      const res = await fetch(`${API_BASE}/api/lobby`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId: user.id,
          creatorName: user.name,
          selectedPokemonDetails: selectedPokemon || null,
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      console.log('✅ Lobby created:', data.code);
      navigate(`/battle/lobby/${data.code}`);
    } catch (err) {
      console.error('❌ Lobby creation error:', err);
      setError('Failed to create lobby.');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinLobby = async () => {
    if (!user) return setError('Please log in first!');
    if (!lobbyCode.trim()) return setError('Enter a lobby code!');

    setJoining(true);
    setError('');
    const code = lobbyCode.trim().toUpperCase();

    try {
      console.log('🚪 Validating lobby:', code);
      const res = await fetch(
        `${API_BASE}/api/lobby/${encodeURIComponent(code)}`,
      );

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      console.log('✅ Lobby found:', data);
      navigate(`/battle/lobby/${code}`);
    } catch (err) {
      console.error('❌ Join lobby error:', err);
      setError('Lobby not found or invalid code.');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden" style={{
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
        <div className="absolute bottom-20 left-1/3 w-24 h-24 bg-purple-400" style={{
          clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
          filter: 'blur(20px)'
        }}></div>
      </div>

      {/* Header */}
      <div className="relative z-10">
        <div className="flex justify-between items-center p-6 max-w-7xl mx-auto">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-3 bg-gray-900 border-2 border-gray-700 text-white hover:border-yellow-400 transition-all hover:scale-110"
            title="Back to Dashboard"
            style={{ fontFamily: 'monospace' }}
          >
            <Home className="w-5 h-5" strokeWidth={3} />
          </button>

          <h1 className="text-3xl md:text-4xl font-black" style={{
            fontFamily: 'monospace',
            color: '#fbbf24',
            textShadow: '3px 3px 0 #dc2626'
          }}>
            BATTLE <span className="text-red-500">ARENA</span>
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-100px)] px-6 py-12">
        <div className="w-full max-w-2xl">
          {/* Subtitle */}
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-black text-white mb-3" style={{ fontFamily: 'monospace' }}>
              CREATE OR JOIN BATTLE
            </h2>
            <p className="text-green-400 text-lg" style={{ fontFamily: 'monospace' }}>
              &gt; ENTER_THE_ARENA.EXE
            </p>
          </div>

          {/* Main Card Container */}
          <div className="space-y-6">
            {/* Create Lobby Card */}
            <div className="bg-gray-900 border-4 border-yellow-400 p-8 hover:border-green-400 transition-all duration-300" style={{ fontFamily: 'monospace', boxShadow: '0 8px 0 #92400e' }}>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center" style={{
                  clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
                  boxShadow: '0 4px 0 #166534'
                }}>
                  <Plus className="w-7 h-7 text-black" strokeWidth={3} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase">Create Lobby</h3>
                  <p className="text-yellow-400 text-sm font-black">Host and wait for challengers</p>
                </div>
              </div>

              <button
                onClick={handleCreateLobby}
                disabled={creating || !user}
                className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-black font-black border-4 border-green-700 hover:border-green-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 uppercase"
                style={{ fontFamily: 'monospace', boxShadow: '0 8px 0 #166534' }}
              >
                <Zap className="w-5 h-5" strokeWidth={3} />
                {creating ? 'Creating...' : 'Create Lobby'}
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-1 bg-yellow-400"></div>
              <span className="text-yellow-400 font-black text-lg px-4" style={{ fontFamily: 'monospace' }}>OR</span>
              <div className="flex-1 h-1 bg-yellow-400"></div>
            </div>

            {/* Join Lobby Card */}
            <div className="bg-gray-900 border-4 border-yellow-400 p-8 hover:border-blue-400 transition-all duration-300" style={{ fontFamily: 'monospace', boxShadow: '0 8px 0 #92400e' }}>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center" style={{
                  clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
                  boxShadow: '0 4px 0 #1e40af'
                }}>
                  <LogIn className="w-7 h-7 text-black" strokeWidth={3} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase">Join Lobby</h3>
                  <p className="text-yellow-400 text-sm font-black">Enter code to join battle</p>
                </div>
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  value={lobbyCode}
                  onChange={(e) => setLobbyCode(e.target.value.toUpperCase())}
                  placeholder="ENTER LOBBY CODE"
                  className="w-full px-6 py-4 bg-gray-950 border-4 border-gray-700 text-white font-black placeholder-yellow-400/50 focus:outline-none focus:border-yellow-400 transition-all duration-300 uppercase"
                  style={{ fontFamily: 'monospace' }}
                />

                <button
                  onClick={handleJoinLobby}
                  disabled={joining || !user}
                  className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-black border-4 border-blue-700 hover:border-blue-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 uppercase"
                  style={{ fontFamily: 'monospace', boxShadow: '0 8px 0 #1e40af' }}
                >
                  <Zap className="w-5 h-5" strokeWidth={3} />
                  {joining ? 'Joining...' : 'Join Lobby'}
                </button>
              </div>
            </div>
          </div>

          {/* Error Messages */}
          {error && (
            <div className="mt-6 p-4 bg-gray-900 border-4 border-red-500 text-red-400 text-center font-black uppercase" style={{ fontFamily: 'monospace' }}>
              ❌ {error}
            </div>
          )}

          {/* Login Required Message */}
          {!user && (
            <div className="mt-6 p-4 bg-gray-900 border-4 border-amber-500 text-amber-400 text-center font-black uppercase" style={{ fontFamily: 'monospace' }}>
              ⚠️ LOGIN REQUIRED
            </div>
          )}

          {/* Info Footer */}
          <div className="mt-12 text-center">
            <p className="text-yellow-400 text-sm font-black uppercase" style={{ fontFamily: 'monospace' }}>
              &gt; READY_TO_BATTLE.EXE
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Battle;
