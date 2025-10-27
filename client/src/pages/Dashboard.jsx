// Dashboard.jsx
import React, { useContext } from 'react';
import AuthContext from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, ShoppingCart, Sword, User, Bell, Star, Home } from 'lucide-react';

export default function Dashboard() {
  const { user, logout, selectedPokemon } = useContext(AuthContext);
  const navigate = useNavigate();

  const doLogout = () => {
    logout();
    navigate('/');
  };

  const hasPokemon = user?.pokemon?.length > 0 || !!selectedPokemon;
  const chosen = selectedPokemon || user?.pokemon?.[0]?.pokemonId;

  const navigationButtons = [
    { icon: ShoppingCart, label: 'Marketplace', to: '/market-place', color: 'bg-emerald-500 hover:bg-emerald-400' },
    {
      icon: Star,
      label: hasPokemon ? 'Select Pokémon' : 'Get First Pokémon',
      to: hasPokemon ? '/select-pokemon' : '/get-first-pokemon',
      color: 'bg-amber-500 hover:bg-amber-400'
    },
    { icon: Sword, label: 'Battle Arena', to: '/battle', color: 'bg-rose-500 hover:bg-rose-400' },
  ];

  const topIcons = [
    { icon: Home, to: '/', tooltip: 'Home' },
    { icon: User, to: '/profile', tooltip: 'Profile' },
    { icon: Bell, to: '/notifications', tooltip: 'Notifications' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-blue-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-20 h-20 bg-yellow-400 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-blue-400 rounded-full blur-xl animate-pulse delay-75"></div>
        <div className="absolute bottom-20 left-1/3 w-24 h-24 bg-purple-400 rounded-full blur-xl animate-pulse delay-150"></div>
      </div>

      {/* Header */}
      <div className="relative z-10">
        <div className="flex justify-between items-center p-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-8 bg-gradient-to-b from-yellow-400 to-amber-500 rounded-full"></div>
            <h1 className="text-xl font-bold text-white">Pokémon Battle</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              {topIcons.map(({ icon: Icon, to, tooltip }) => (
                <button
                  key={to}
                  onClick={() => navigate(to)}
                  className="p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all duration-300 hover:scale-110 group relative"
                  title={tooltip}
                >
                  <Icon className="w-5 h-5" />
                  <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                    {tooltip}
                  </span>
                </button>
              ))}
              <button
                onClick={doLogout}
                className="p-3 rounded-xl bg-rose-500/20 backdrop-blur-sm border border-rose-500/30 text-rose-400 hover:bg-rose-500/30 transition-all duration-300 hover:scale-110"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
        {/* Welcome Section */}
        <div className="mb-12">
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight">
            Welcome,{' '}
            <span className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
              {user?.name || 'Trainer'}!
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Ready for your next adventure? Choose your path and become the ultimate Pokémon champion!
          </p>
        </div>

        {/* Pokémon Display */}
        {hasPokemon && chosen?.sprite && (
          <div className="mb-16 relative">
            <div className="relative w-48 h-48 md:w-64 md:h-64">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-amber-500/20 rounded-full blur-2xl animate-pulse"></div>
              <div
                className="relative w-full h-full z-10 animate-float"
                style={{
                  backgroundImage: `url(${chosen.sprite})`,
                  backgroundPosition: '15px 0px',
                  backgroundSize: '1000px 1000px',
                  backgroundRepeat: 'no-repeat',
                  imageRendering: 'pixelated',
                }}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-6 max-w-4xl mx-auto">
          {navigationButtons.map(({ icon: Icon, label, to, color }) => (
            <button
              key={label}
              onClick={() => navigate(to)}
              className={`group relative flex items-center gap-4 px-8 py-6 ${color} text-white font-bold rounded-2xl hover:scale-105 shadow-2xl transition-all duration-300 hover:shadow-xl min-w-[200px]`}
            >
              <div className="relative">
                <Icon className="w-6 h-6" />
                <div className="absolute inset-0 bg-white/20 rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <span className="text-lg">{label}</span>
              <div className="absolute inset-0 rounded-2xl border-2 border-white/20 group-hover:border-white/40 transition-colors duration-300"></div>
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center pb-8">
        <p className="text-gray-400 text-sm">
          Ready to battle? Choose your path and let the adventure begin!
        </p>
      </div>
    </div>
  );
}