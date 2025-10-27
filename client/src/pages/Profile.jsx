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

  const stats = [
    { label: 'Wins', value: user?.stats?.wins || 0, color: 'text-emerald-400', bg: 'bg-emerald-500/20', icon: Trophy },
    { label: 'Losses', value: user?.stats?.losses || 0, color: 'text-rose-400', bg: 'bg-rose-500/20', icon: Heart },
    { label: 'Draws', value: user?.stats?.draws || 0, color: 'text-blue-400', bg: 'bg-blue-500/20', icon: Shield },
    { 
      label: 'Win Rate', 
      value: user?.stats?.wins && user?.stats?.losses 
        ? `${((user.stats.wins / (user.stats.wins + user.stats.losses)) * 100).toFixed(1)}%`
        : '0%', 
      color: 'text-amber-400', 
      bg: 'bg-amber-500/20', 
      icon: Target 
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-blue-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-24 h-24 bg-amber-400 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-20 h-20 bg-blue-400 rounded-full blur-2xl animate-pulse delay-75"></div>
      </div>

      {/* Header */}
      <div className="relative z-10">
        <div className="flex justify-between items-center p-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all duration-300"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 px-6 py-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-black text-white mb-4">
            Trainer <span className="bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">Profile</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Manage your account, track your progress, and showcase your Pokémon journey
          </p>
        </div>

        {/* Profile Card */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-3xl p-8 shadow-2xl">
              {/* Avatar & Basic Info */}
              <div className="text-center mb-8">
                <div className="w-32 h-32 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center text-4xl font-bold text-slate-900 mx-auto mb-6 shadow-2xl">
                  {user?.name?.charAt(0)?.toUpperCase() || 'T'}
                </div>
                
                {isEditing ? (
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white text-center text-xl font-bold focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                      placeholder="Enter username"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-400 disabled:opacity-50 transition-all duration-300"
                      >
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={handleCancel}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-400 transition-all duration-300"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">{user?.name || 'Unknown Trainer'}</h2>
                    <p className="text-gray-400 mb-6">Pokémon Master</p>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-900 font-bold rounded-xl hover:scale-105 transition-transform duration-300 shadow-lg"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit Profile
                    </button>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-rose-500/20 border border-rose-500/30 rounded-xl text-rose-400 text-center animate-pulse">
                  {error}
                </div>
              )}

              {/* Account Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-amber-400" />
                  Account Details
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <span className="text-gray-400 text-sm">Wallet</span>
                    <span className="text-white font-mono text-sm">
                      {user?.address ? `${user.address.slice(0, 6)}...${user.address.slice(-4)}` : 'Not connected'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <span className="text-gray-400 text-sm">Member Since</span>
                    <span className="text-white text-sm">{formatDate(user?.createdAt)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <span className="text-gray-400 text-sm">Last Login</span>
                    <span className="text-white text-sm">{formatDate(user?.lastLogin)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Stats & Activity */}
          <div className="lg:col-span-2 space-y-8">
            {/* Battle Stats */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-3xl p-8 shadow-2xl">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Trophy className="w-6 h-6 text-amber-400" />
                Battle Statistics
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map(({ label, value, color, bg, icon: Icon }) => (
                  <div key={label} className={`${bg} border border-white/10 rounded-2xl p-6 text-center backdrop-blur-sm`}>
                    <Icon className={`w-8 h-8 ${color} mx-auto mb-3`} />
                    <div className={`text-2xl font-bold ${color} mb-1`}>{value}</div>
                    <div className="text-gray-400 text-sm">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pokémon Collection */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-3xl p-8 shadow-2xl">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Star className="w-6 h-6 text-amber-400" />
                Pokémon Collection
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl">
                    <span className="text-gray-400">Total Pokémon</span>
                    <span className="text-2xl font-bold text-amber-400">{user?.pokemon?.length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl">
                    <span className="text-gray-400">Selected Pokémon</span>
                    <span className="text-white font-semibold">{user?.selectedPokemon?.name || 'None'}</span>
                  </div>
                </div>
                <div className="p-4 bg-white/5 rounded-xl">
                  <div className="text-gray-400 mb-2">Pokémon Types</div>
                  <div className="flex flex-wrap gap-2">
                    {user?.pokemon?.length > 0 ? (
                      [...new Set(user.pokemon.map(p => p.pokemonId?.type).filter(Boolean))].map(type => (
                        <span key={type} className="px-3 py-1 bg-amber-400/20 text-amber-400 rounded-full text-sm font-medium capitalize">
                          {type}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500">No types yet</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-3xl p-8 shadow-2xl">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Calendar className="w-6 h-6 text-amber-400" />
                Recent Activity
              </h3>
              <div className="space-y-3">
                {user?.recentActivity?.length > 0 ? (
                  user.recentActivity.slice(0, 5).map((activity, index) => (
                    <div key={index} className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300">
                      <div className="flex items-center gap-3">
                        <Zap className="w-4 h-4 text-amber-400" />
                        <span className="text-white">{activity.description}</span>
                      </div>
                      <span className="text-gray-400 text-sm">{formatDate(activity.date)}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-lg">No recent activity</div>
                    <p className="text-gray-500 text-sm mt-2">Your battles and achievements will appear here</p>
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