import React, { useContext } from 'react';
import AuthContext from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, ShoppingCart, Sword, User, Bell, Star, Home } from 'lucide-react';
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
  ];

  const topIcons = [
    { icon: Home, to: '/', tooltip: 'Home' },
    { icon: User, to: '/profile', tooltip: 'Profile' },
    { icon: Bell, to: '/notifications', tooltip: 'Notifications' },
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

      {/* Header */}
      <div className="relative z-10">
        <div className="flex justify-between items-center p-6 border-b-2 border-yellow-400">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black" style={{ fontFamily: 'monospace', color: '#fbbf24', textShadow: '2px 2px 0 #dc2626' }}>
              POKE SHOOT
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            {topIcons.map(({ icon: Icon, to, tooltip }) => {
              const IconComponent = Icon;
              return (
                <button
                  key={to}
                  onClick={() => navigate(to)}
                  className="p-3 bg-gray-900 border-2 border-gray-700 text-white hover:border-yellow-400 transition-all hover:scale-110"
                  title={tooltip}
                  style={{ fontFamily: 'monospace' }}
                >
                  <IconComponent className="w-5 h-5" strokeWidth={3} />
                </button>
              )
            })}
            <button
              onClick={doLogout}
              className="p-3 bg-gray-900 border-2 border-red-700 text-red-400 hover:border-red-400 transition-all hover:scale-110"
              title="Logout"
              style={{ fontFamily: 'monospace' }}
            >
              <LogOut className="w-5 h-5" strokeWidth={3} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] px-6 text-center py-12">
        {/* Wallet Connection Section */}
        <div className="mb-8 max-w-md w-full">
          <WalletConnect 
            onWalletLinked={() => {
              // Refresh user data to get updated wallet info
              window.location.reload();
            }}
          />
        </div>

        {/* Welcome Section */}
        <div className="mb-12">
          <h2 className="text-5xl md:text-7xl font-black mb-6 leading-tight" style={{
            fontFamily: 'monospace',
            color: '#fbbf24',
            textShadow: '3px 3px 0 #dc2626, 5px 5px 0 #000'
          }}>
            WELCOME,{' '}
            <span className="text-white">
              {user?.name?.toUpperCase() || 'TRAINER'}!
            </span>
          </h2>
          <p className="text-xl text-green-400 max-w-2xl mx-auto" style={{ fontFamily: 'monospace' }}>
            &gt; READY_TO_BATTLE.EXE
          </p>
        </div>

        {/* Pokémon Display */}
        {hasPokemon && chosen?.sprite && (
          <div className="mb-16 relative">
            {/* Outer glow effect */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 md:w-80 md:h-80 bg-green-400 opacity-20 blur-3xl animate-pulse"></div>
            </div>
            
            {/* Frame with 8-bit style */}
            <div className="relative bg-gradient-to-br from-yellow-600 via-amber-600 to-yellow-600 p-2" style={{
              clipPath: 'polygon(10% 0%, 90% 0%, 100% 10%, 100% 90%, 90% 100%, 10% 100%, 0% 90%, 0% 10%)',
              boxShadow: '0 0 30px rgba(250, 204, 21, 0.5), inset 0 0 20px rgba(0, 0, 0, 0.5)'
            }}>
              {/* Inner border */}
              <div className="bg-gray-900 p-3 border-4 border-black">
                {/* Sprite container */}
                <div 
                  className="w-56 h-56 md:w-72 md:h-72 bg-gradient-to-b from-blue-900 via-purple-900 to-blue-900 flex items-center justify-center"
                  style={{
                    backgroundImage: `url(${chosen.sprite})`,
                    backgroundPosition: '15px 0px',
                    backgroundSize: '1000px 1000px',
                    backgroundRepeat: 'no-repeat',
                    imageRendering: 'pixelated',
                  }}
                >
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-6xl font-black opacity-20" style={{ fontFamily: 'monospace', color: '#fff' }}>
                      ★
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Name/Label */}
            {chosen?.name && (
              <div className="mt-4">
                <div className="bg-gray-900 px-6 py-2 border-2 border-yellow-400 inline-block">
                  <span className="text-yellow-400 font-black text-xl" style={{ fontFamily: 'monospace' }}>
                    {chosen.name.toUpperCase()}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-6 max-w-4xl mx-auto">
          {navigationButtons.map(({ icon: Icon, label, to }) => {
            const IconComponent = Icon;
            return (
              <button
                key={label}
                onClick={() => navigate(to)}
                className="group relative flex items-center gap-4 px-8 py-6 bg-gray-900 border-4 border-yellow-400 text-white hover:border-green-400 transition-all hover:scale-105 min-w-[200px] transform"
                style={{ 
                  fontFamily: 'monospace',
                  boxShadow: '0 8px 0 #92400e',
                }}
              >
                <IconComponent className="w-6 h-6" strokeWidth={3} />
                <span className="text-lg font-black">{label.toUpperCase()}</span>
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