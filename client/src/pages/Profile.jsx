// Profile.jsx
import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { ArrowLeft, User, Star, Trophy, Calendar, Edit3, Save, X, Shield, Zap, Heart, Target } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

const Profile = () => {
  const { user, token, refreshUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async () => {
    if (!editName.trim()) {
      setError('Name cannot be empty');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await axios.put(
        `${API_BASE}/api/auth/profile`,
        { name: editName.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await refreshUser();
      setIsEditing(false);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditName(user?.name || '');
    setIsEditing(false);
    setError(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Calculate losses from matches played and matches won
  const matchesWon = user?.stats?.matchesWon || 0;
  const matchesPlayed = user?.stats?.matchesPlayed || 0;
  const losses = matchesPlayed - matchesWon;
  const winRate = matchesPlayed > 0 ? ((matchesWon / matchesPlayed) * 100).toFixed(1) : 0;

  const stats = [
    { label: 'Wins', value: matchesWon, color: 'text-emerald-400', bg: 'bg-emerald-500/20', icon: Trophy },
    { label: 'Losses', value: losses, color: 'text-rose-400', bg: 'bg-rose-500/20', icon: Heart },
    { label: 'Matches', value: matchesPlayed, color: 'text-blue-400', bg: 'bg-blue-500/20', icon: Shield },
    { 
      label: 'Win Rate', 
      value: `${winRate}%`, 
      color: 'text-amber-400', 
      bg: 'bg-amber-500/20', 
      icon: Target 
    }
  ];

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
        <div className="absolute bottom-20 right-20 w-16 h-16 bg-blue-400" style={{
          clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
          filter: 'blur(20px)'
        }}></div>
        <div className="absolute top-1/3 right-1/3 w-24 h-24 bg-purple-400" style={{
          clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
          filter: 'blur(20px)'
        }}></div>
      </div>

      {/* Header */}
      <div className="relative z-10">
        <div className="flex justify-between items-center p-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 border-2 border-yellow-400 text-yellow-400 hover:border-green-400 transition-all duration-300"
            style={{ fontFamily: 'monospace' }}
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={3} />
            <span className="font-bold">BACK TO DASHBOARD</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 px-6 py-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-7xl font-black mb-4 leading-tight text-glow" style={{
            fontFamily: 'monospace',
            color: '#fbbf24',
            textShadow: '3px 3px 0 #dc2626, 5px 5px 0 #000, 0 0 30px rgba(251, 191, 36, 0.5)'
          }}>
            TRAINER PROFILE
          </h1>
          <p className="text-xl text-green-400 max-w-2xl mx-auto" style={{ fontFamily: 'monospace' }}>
            &gt; PROFILE.EXE | TRACK • MANAGE • SHOWCASE
          </p>
        </div>

        {/* Profile Card */}
        <div className="grid lg:grid-cols-3 gap-8 items-start">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 backdrop-blur-sm border-4 border-yellow-400 p-8 game-card card-elevated animate-slide-in" style={{ boxShadow: '0 10px 0 #92400e, 0 0 35px rgba(251, 191, 36, 0.4)' }}>
              {/* Avatar & Basic Info */}
              <div className="text-center mb-8">
                <div className="w-32 h-32 bg-yellow-400 flex items-center justify-center text-4xl font-bold text-black mx-auto mb-6 border-4 border-yellow-600 animate-float" style={{
                  clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
                  boxShadow: '0 8px 0 #ca8a04, 0 0 30px rgba(251, 191, 36, 0.5)',
                  fontFamily: 'monospace'
                }}>
                  {user?.name?.charAt(0)?.toUpperCase() || 'T'}
                </div>
                
                {isEditing ? (
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-4 py-3 bg-black border-2 border-yellow-400 text-yellow-400 text-center text-xl font-bold focus:outline-none focus:border-green-400"
                      style={{ fontFamily: 'monospace' }}
                      placeholder="USERNAME"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-500 text-black font-bold hover:bg-green-400 disabled:opacity-50 transition-all duration-300 border-2 border-green-700"
                        style={{ fontFamily: 'monospace', boxShadow: '0 4px 0 #166534' }}
                      >
                        <Save className="w-4 h-4" strokeWidth={3} />
                        {saving ? 'SAVING...' : 'SAVE'}
                      </button>
                      <button
                        onClick={handleCancel}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-500 text-white font-bold hover:bg-red-400 transition-all duration-300 border-2 border-red-700"
                        style={{ fontFamily: 'monospace', boxShadow: '0 4px 0 #991b1b' }}
                      >
                        <X className="w-4 h-4" strokeWidth={3} />
                        CANCEL
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h2 className="text-2xl font-bold text-yellow-400 mb-2" style={{ fontFamily: 'monospace' }}>{user?.name?.toUpperCase() || 'UNKNOWN TRAINER'}</h2>
                    <p className="text-green-400 mb-6 font-bold" style={{ fontFamily: 'monospace' }}>POKEMON MASTER</p>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center justify-center gap-2 w-full py-3 bg-yellow-400 text-black font-bold hover:bg-yellow-300 border-4 border-yellow-600 transition-transform duration-300"
                      style={{ fontFamily: 'monospace', boxShadow: '0 8px 0 #ca8a04' }}
                    >
                      <Edit3 className="w-4 h-4" strokeWidth={3} />
                      EDIT PROFILE
                    </button>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-900 border-4 border-red-500 text-red-400 text-center animate-pulse font-bold" style={{ fontFamily: 'monospace' }}>
                  ⚠ {error}
                </div>
              )}

              {/* Ranking Info */}
              <div className="space-y-4 mb-6">
                <h3 className="text-lg font-bold text-yellow-400 flex items-center gap-2" style={{ fontFamily: 'monospace' }}>
                  <Trophy className="w-5 h-5" strokeWidth={3} />
                  RANKING
                </h3>
                <div className="space-y-3">
                  <div className="p-4 bg-gradient-to-br from-yellow-600/20 to-amber-600/20 border-2 border-yellow-400 text-center">
                    <div className="text-gray-400 text-xs font-bold mb-1" style={{ fontFamily: 'monospace' }}>ELO RATING</div>
                    <div className="text-3xl font-bold text-yellow-400" style={{ fontFamily: 'monospace' }}>
                      {user?.ranking?.elo || 1000}
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-black border-2 border-gray-700">
                    <span className="text-gray-400 text-sm font-bold" style={{ fontFamily: 'monospace' }}>TIER</span>
                    <span className="text-yellow-400 text-sm font-bold uppercase" style={{ fontFamily: 'monospace' }}>
                      {user?.ranking?.tier || 'Bronze'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-black border-2 border-gray-700">
                    <span className="text-gray-400 text-sm font-bold" style={{ fontFamily: 'monospace' }}>RANK</span>
                    <span className="text-yellow-400 text-sm font-bold" style={{ fontFamily: 'monospace' }}>
                      {user?.ranking?.rank || 'Unranked'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Account Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-yellow-400 flex items-center gap-2" style={{ fontFamily: 'monospace' }}>
                  <User className="w-5 h-5" strokeWidth={3} />
                  ACCOUNT DETAILS
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-black border-2 border-gray-700">
                    <span className="text-gray-400 text-sm font-bold" style={{ fontFamily: 'monospace' }}>WALLET</span>
                    <span className="text-yellow-400 font-mono text-sm font-bold" style={{ fontFamily: 'monospace' }}>
                      {user?.walletAddress ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}` : 'NOT CONNECTED'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-black border-2 border-gray-700">
                    <span className="text-gray-400 text-sm font-bold" style={{ fontFamily: 'monospace' }}>MEMBER SINCE</span>
                    <span className="text-white text-sm font-bold" style={{ fontFamily: 'monospace' }}>{formatDate(user?.createdAt)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-black border-2 border-gray-700">
                    <span className="text-gray-400 text-sm font-bold" style={{ fontFamily: 'monospace' }}>LAST ACTIVE</span>
                    <span className="text-white text-sm font-bold" style={{ fontFamily: 'monospace' }}>{formatDate(user?.lastActive)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Stats & Activity */}
          <div className="lg:col-span-2 space-y-8">
              {/* Battle Stats */}
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 backdrop-blur-sm border-4 border-blue-500 p-8 game-card card-elevated animate-slide-in" style={{ boxShadow: '0 10px 0 #1e40af, 0 0 35px rgba(59, 130, 246, 0.4)', animationDelay: '0.1s' }}>
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3" style={{ fontFamily: 'monospace' }}>
                <Trophy className="w-6 h-6 text-yellow-400 animate-float flex-shrink-0" strokeWidth={3} />
                BATTLE STATISTICS
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map(({ label, value, color, bg, icon: Icon }, index) => (
                  <div 
                    key={label} 
                    className={`${bg} border-2 border-gray-700 p-6 text-center game-card animate-slide-in hover:scale-105 transition-all duration-300`} 
                    style={{ 
                      fontFamily: 'monospace',
                      animationDelay: `${index * 0.1}s`,
                      boxShadow: '0 4px 0 rgba(0, 0, 0, 0.3), 0 0 15px rgba(0, 0, 0, 0.2)'
                    }}
                  >
                    <Icon className={`w-8 h-8 ${color} mx-auto mb-3 animate-float`} strokeWidth={3} style={{ animationDelay: `${index * 0.1}s` }} />
                    <div className={`text-2xl font-bold ${color} mb-1 animate-battle-pulse`} style={{ animationDelay: `${index * 0.1}s` }}>{value}</div>
                    <div className="text-gray-400 text-sm font-bold">{label.toUpperCase()}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pokémon Collection */}
            <div className="bg-gray-900 border-4 border-green-500 p-8 game-card animate-slide-in" style={{ boxShadow: '0 8px 0 #166534, 0 0 25px rgba(34, 197, 94, 0.3)', animationDelay: '0.2s' }}>
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3" style={{ fontFamily: 'monospace' }}>
                <Star className="w-6 h-6 text-yellow-400 animate-float" strokeWidth={3} />
                POKEMON COLLECTION
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-black border-2 border-gray-700">
                    <span className="text-gray-400 font-bold" style={{ fontFamily: 'monospace' }}>TOTAL POKEMON</span>
                    <span className="text-2xl font-bold text-yellow-400" style={{ fontFamily: 'monospace' }}>{user?.pokemon?.length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-black border-2 border-gray-700">
                    <span className="text-gray-400 font-bold" style={{ fontFamily: 'monospace' }}>SELECTED</span>
                    <span className="text-white font-bold" style={{ fontFamily: 'monospace' }}>{(user?.selectedPokemon?.name || 'NONE').toUpperCase()}</span>
                  </div>
                </div>
                <div className="p-4 bg-black border-2 border-gray-700">
                  <div className="text-gray-400 mb-2 font-bold" style={{ fontFamily: 'monospace' }}>POKEMON TYPES</div>
                  <div className="flex flex-wrap gap-2">
                    {user?.pokemon?.length > 0 ? (
                      [...new Set(user.pokemon.map(p => p.pokemonId?.type).filter(Boolean))].map(type => (
                        <span key={type} className="px-3 py-1 bg-yellow-400/20 border-2 border-yellow-400 text-yellow-400 text-sm font-bold" style={{ fontFamily: 'monospace' }}>
                          {type.toUpperCase()}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500 font-bold" style={{ fontFamily: 'monospace' }}>NO TYPES YET</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-gray-900 border-4 border-purple-500 p-8 game-card animate-slide-in" style={{ boxShadow: '0 8px 0 #7c3aed, 0 0 25px rgba(168, 85, 247, 0.3)', animationDelay: '0.3s' }}>
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3" style={{ fontFamily: 'monospace' }}>
                <Calendar className="w-6 h-6 text-yellow-400 animate-float" strokeWidth={3} />
                RECENT ACTIVITY
              </h3>
              <div className="space-y-3">
                {user?.recentActivity?.length > 0 ? (
                  user.recentActivity.slice(0, 5).map((activity, index) => (
                    <div key={index} className="flex justify-between items-center p-4 bg-black border-2 border-gray-700 hover:border-yellow-400 transition-all duration-300" style={{ fontFamily: 'monospace' }}>
                      <div className="flex items-center gap-3">
                        <Zap className="w-4 h-4 text-yellow-400" strokeWidth={3} />
                        <span className="text-white font-bold">{activity.description.toUpperCase()}</span>
                      </div>
                      <span className="text-gray-400 text-sm font-bold">{formatDate(activity.date)}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-lg font-bold" style={{ fontFamily: 'monospace' }}>NO ACTIVITY</div>
                    <p className="text-green-400 text-sm mt-2 font-bold" style={{ fontFamily: 'monospace' }}>BATTLES & ACHIEVEMENTS APPEAR HERE</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;