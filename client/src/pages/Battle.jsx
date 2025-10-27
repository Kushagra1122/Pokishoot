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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-blue-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-10 left-10 w-20 h-20 bg-yellow-400 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-blue-400 rounded-full blur-xl animate-pulse delay-75"></div>
        <div className="absolute bottom-20 left-1/3 w-24 h-24 bg-purple-400 rounded-full blur-xl animate-pulse delay-150"></div>
      </div>

      {/* Header */}
      <div className="relative z-10">
        <div className="flex justify-between items-center p-6 max-w-7xl mx-auto">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all duration-300 hover:scale-110"
            title="Back to Dashboard"
          >
            <Home className="w-5 h-5" />
          </button>

          <h1 className="text-3xl md:text-4xl font-black text-white">
            Battle <span className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">Arena</span>
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-100px)] px-6 py-12">
        <div className="w-full max-w-2xl">
          {/* Subtitle */}
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Create or Join a Battle
            </h2>
            <p className="text-gray-300 text-lg">
              Challenge other trainers in thrilling Pokémon battles
            </p>
          </div>

          {/* Main Card Container */}
          <div className="space-y-6">
            {/* Create Lobby Card */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 hover:border-white/20 transition-all duration-300">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Create Lobby</h3>
                  <p className="text-gray-400 text-sm">Be the host and wait for challengers</p>
                </div>
              </div>

              <button
                onClick={handleCreateLobby}
                disabled={creating || !user}
                className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-2xl hover:shadow-lg hover:scale-105 shadow-lg transition-all duration-300 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Zap className="w-5 h-5" />
                {creating ? 'Creating Battle Lobby...' : 'Create New Lobby'}
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
              <span className="text-white/60 font-semibold text-sm px-4">OR</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            </div>

            {/* Join Lobby Card */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 hover:border-white/20 transition-all duration-300">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
                  <LogIn className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Join Lobby</h3>
                  <p className="text-gray-400 text-sm">Enter a code to join an existing battle</p>
                </div>
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  value={lobbyCode}
                  onChange={(e) => setLobbyCode(e.target.value.toUpperCase())}
                  placeholder="Enter Lobby Code (e.g., ABC123)"
                  className="w-full px-6 py-4 rounded-2xl bg-white/10 border border-white/20 text-white font-semibold placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                />

                <button
                  onClick={handleJoinLobby}
                  disabled={joining || !user}
                  className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-2xl hover:shadow-lg hover:scale-105 shadow-lg transition-all duration-300 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Zap className="w-5 h-5" />
                  {joining ? 'Joining Battle...' : 'Join Lobby'}
                </button>
              </div>
            </div>
          </div>

          {/* Error Messages */}
          {error && (
            <div className="mt-6 p-4 bg-rose-500/20 backdrop-blur-sm border border-rose-500/30 rounded-2xl text-rose-300 text-center font-semibold">
              {error}
            </div>
          )}

          {/* Login Required Message */}
          {!user && (
            <div className="mt-6 p-4 bg-amber-500/20 backdrop-blur-sm border border-amber-500/30 rounded-2xl text-amber-300 text-center font-semibold">
              ⚠️ Please log in to access battles
            </div>
          )}

          {/* Info Footer */}
          <div className="mt-12 text-center">
            <p className="text-gray-400 text-sm">
              Ready to prove your skills? Create a lobby or join your friend's battle!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Battle;
