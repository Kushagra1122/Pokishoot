import React, { useContext } from 'react';
import AuthContext from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, ShoppingCart, Sword, User, Star, Home, Network, Trophy } from 'lucide-react';
import WalletConnect from '../components/WalletConnect';

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
    { icon: Network, label: 'Cross-Chain Leaderboard', to: '/crosschain-leaderboard', color: 'bg-purple-500 hover:bg-purple-400' },
  ];

  const topIcons = [
    { icon: Home, to: '/', tooltip: 'Home' },
    { icon: User, to: '/profile', tooltip: 'Profile' },
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
        <div className="absolute top-40 right-20 w-16 h-16 bg-blue-400" style={{
          clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
          filter: 'blur(20px)'
        }}></div>
        <div className="absolute bottom-20 left-1/3 w-24 h-24 bg-purple-400" style={{
          clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
          filter: 'blur(20px)'
        }}></div>
      </div>

      {/* Header - Game UI Style */}
      <div className="relative z-10">
        <div className="flex justify-between items-center p-4 border-b-4 border-yellow-400 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 game-panel" style={{ borderColor: '#fbbf24' }}>
          <div className="flex items-center gap-4">
            <img 
              src="/logo.png" 
              alt="PokeWars" 
              className="h-10 md:h-12 object-contain cursor-pointer hover:opacity-80 transition-opacity filter drop-shadow-lg"
              onClick={() => navigate('/')}
            />
            {user && (
              <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-black/50 border-2 border-yellow-400/50">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-yellow-400 font-black text-sm uppercase" style={{ fontFamily: 'monospace' }}>
                  {user.name?.toUpperCase() || 'TRAINER'}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {topIcons.map(({ icon: Icon, to, tooltip }) => {
              const IconComponent = Icon;
              return (
                <button
                  key={to}
                  onClick={() => navigate(to)}
                  className="p-3 bg-black/60 border-2 border-gray-700 text-white hover:border-yellow-400 transition-all hover:scale-110 game-button"
                  title={tooltip}
                  style={{ fontFamily: 'monospace', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)' }}
                >
                  <IconComponent className="w-5 h-5" strokeWidth={3} />
                </button>
              )
            })}
            <button
              onClick={doLogout}
              className="p-3 bg-black/60 border-2 border-red-700 text-red-400 hover:border-red-400 transition-all hover:scale-110 game-button"
              title="Logout"
              style={{ fontFamily: 'monospace', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)' }}
            >
              <LogOut className="w-5 h-5" strokeWidth={3} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] px-6 text-center py-12">
        {/* Wallet Connection Section */}
        <div className="mb-8 max-w-md w-full mx-auto">
          <WalletConnect 
            onWalletLinked={() => {
              // Refresh user data to get updated wallet info
              window.location.reload();
            }}
          />
        </div>

        {/* Welcome Section - Clear Game UI */}
        <div className="mb-12 animate-slide-in">
          <div className="game-panel border-yellow-400 p-8 mb-6 max-w-4xl mx-auto" style={{ borderColor: '#fbbf24' }}>
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <h2 className="heading-primary text-glow" style={{
                fontFamily: 'monospace',
                color: '#fbbf24',
                textShadow: '3px 3px 0 #dc2626, 5px 5px 0 #000, 0 0 30px rgba(251, 191, 36, 0.5)'
              }}>
                WELCOME, <span className="text-white">{user?.name?.toUpperCase() || 'TRAINER'}</span>
              </h2>
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <div className="section-divider border-yellow-400"></div>
            <p className="text-lg text-green-400 text-center font-black uppercase tracking-wider" style={{ fontFamily: 'monospace' }}>
              &gt; READY_TO_BATTLE.EXE
            </p>
          </div>
        </div>

        {/* Pokémon Display - Game UI Style */}
        {hasPokemon && chosen?.sprite && (
          <div className="mb-12 relative animate-slide-in max-w-2xl mx-auto">
            <div className="game-panel border-yellow-400 p-6" style={{ borderColor: '#fbbf24' }}>
              {/* Pokémon Sprite Frame */}
              <div className="relative bg-gradient-to-br from-yellow-600 via-amber-600 to-yellow-600 p-3 mb-4" style={{
                clipPath: 'polygon(10% 0%, 90% 0%, 100% 10%, 100% 90%, 90% 100%, 10% 100%, 0% 90%, 0% 10%)',
                boxShadow: 'inset 0 4px 8px rgba(0,0,0,0.5), 0 0 30px rgba(250, 204, 21, 0.5)'
              }}>
                <div className="bg-gray-900 p-4 border-4 border-black">
                  <div 
                    className="w-48 h-48 md:w-64 md:h-64 bg-gradient-to-b from-blue-900 via-purple-900 to-blue-900 flex items-center justify-center animate-float mx-auto"
                    style={{
                      backgroundImage: `url(${chosen.sprite})`,
                      backgroundPosition: '15px 0px',
                      backgroundSize: '1000px 1000px',
                      backgroundRepeat: 'no-repeat',
                      imageRendering: 'pixelated',
                      filter: 'drop-shadow(0 0 20px rgba(34, 197, 94, 0.5))'
                    }}
                  />
                </div>
              </div>

              {/* Pokémon Info Panel */}
              {chosen?.name && (
                <div className="info-box">
                  <div className="info-box-content">
                    <div className="heading-secondary text-yellow-400 mb-2" style={{ fontFamily: 'monospace' }}>
                      {chosen.name.toUpperCase()}
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="status-badge ready">ACTIVE</span>
                      {chosen.type && (
                        <span className="text-gray-300 font-black uppercase" style={{ fontFamily: 'monospace' }}>
                          TYPE: {chosen.type.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons - Clear Game UI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto w-full">
          {navigationButtons.map(({ icon: Icon, label, to, color }, index) => {
            const IconComponent = Icon;
            return (
              <button
                key={label}
                onClick={() => navigate(to)}
                className={`group relative flex flex-col items-center justify-center gap-3 px-6 py-6 bg-black/80 border-4 border-yellow-400 text-white hover:border-green-400 transition-all hover:scale-105 transform game-button animate-slide-in`}
                style={{ 
                  fontFamily: 'monospace',
                  boxShadow: '0 8px 0 #92400e, inset 0 2px 4px rgba(0,0,0,0.5), 0 0 20px rgba(251, 191, 36, 0.3)',
                  animationDelay: `${index * 0.1}s`,
                  borderColor: '#fbbf24'
                }}
              >
                <div className="w-12 h-12 bg-yellow-400/20 border-2 border-yellow-400 flex items-center justify-center group-hover:bg-yellow-400/40 transition-colors flex-shrink-0" style={{
                  clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)'
                }}>
                  <IconComponent className="w-6 h-6 text-yellow-400 group-hover:scale-110 transition-transform" strokeWidth={3} />
                </div>
                <span className="text-base font-black uppercase tracking-wider relative z-10 text-center">{label}</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center pb-8">
        <p className="text-gray-400" style={{ fontFamily: 'monospace' }}>
          CHOOSE_YOUR_PATH.EXE
        </p>
      </div>
    </div>
  );
}