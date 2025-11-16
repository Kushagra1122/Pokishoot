import React, { useContext } from 'react'
import AuthContext from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Sword, Users, Trophy } from 'lucide-react'

export default function Home() {
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()

  const features = [
    { icon: Sword, text: 'Epic Battles' },
    { icon: Users, text: 'Live Multiplayer' },
    { icon: Trophy, text: 'Win Rewards' }
  ]

  return (
    <div className="min-h-screen bg-black relative overflow-hidden" style={{
      backgroundImage: `linear-gradient(#0a0a0a 1px, transparent 1px),
                        linear-gradient(90deg, #0a0a0a 1px, transparent 1px)`,
      backgroundSize: '32px 32px',
      backgroundColor: '#000'
    }}>
      {/* Subtle Animated Background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/4 left-1/4 w-40 h-40 bg-yellow-400" style={{
          clipPath: 'polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)',
          filter: 'blur(20px)'
        }}></div>
        <div className="absolute bottom-1/3 right-1/3 w-32 h-32 bg-blue-400" style={{
          clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
          filter: 'blur(20px)'
        }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-36 h-36 bg-purple-400" style={{
          clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
          filter: 'blur(20px)'
        }}></div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
        <div className="max-w-5xl w-full text-center">
          {/* Main Logo */}
          <div className="mb-6 flex justify-center animate-slide-in">
            <div className="relative">
              <img 
                src="/logo.png" 
                alt="PokeWars" 
                className="h-32 md:h-48 lg:h-64 object-contain animate-float relative z-10"
                style={{ filter: 'drop-shadow(0 0 30px rgba(251, 191, 36, 0.5))' }}
              />
              <div className="absolute inset-0 bg-yellow-400 opacity-20 blur-3xl animate-pulse-glow"></div>
            </div>
          </div>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-green-400 mb-12 max-w-2xl mx-auto leading-relaxed text-glow-soft animate-slide-in" style={{ fontFamily: 'monospace', animationDelay: '0.2s' }}>
            &gt; ENTER_THE_ARENA.EXE
            <br />
            <span className="text-yellow-400">Battle in real-time multiplayer arenas</span>
          </p>

          {/* Features - Clear Game UI */}
          <div className="flex flex-wrap justify-center gap-6 mb-16">
            {features.map(({ icon: Icon, text }, index) => {
              const IconComponent = Icon;
              return (
                <div 
                  key={text} 
                  className="game-panel border-yellow-400 px-8 py-5 flex items-center gap-4 animate-slide-in hover:border-green-400 transition-all duration-300"
                  style={{ 
                    animationDelay: `${index * 0.1}s`,
                    borderColor: '#fbbf24',
                    minWidth: '200px'
                  }}
                >
                  <div className="w-12 h-12 bg-yellow-400/20 border-2 border-yellow-400 flex items-center justify-center flex-shrink-0" style={{
                    clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)'
                  }}>
                    <IconComponent className="w-6 h-6 text-yellow-400" strokeWidth={3} />
                  </div>
                  <span className="font-black text-white text-base uppercase tracking-wider whitespace-nowrap" style={{ fontFamily: 'monospace' }}>{text}</span>
                </div>
              )
            })}
          </div>

          {/* Action Button */}
          <div className="flex justify-center">
            <button
              onClick={() => navigate(user ? '/dashboard' : '/login')}
              className="group relative px-20 py-6 bg-gradient-to-r from-green-500 via-emerald-500 to-green-500 text-black font-black text-2xl tracking-wider hover:from-green-400 hover:via-emerald-400 hover:to-green-400 transform hover:scale-110 transition-all duration-300 border-4 border-green-700 inline-block game-button enhanced-button"
              style={{ 
                fontFamily: 'monospace',
                boxShadow: '0 10px 0 #166534, inset 0 2px 0 rgba(255, 255, 255, 0.2)',
                textShadow: 'none',
                filter: 'none',
                backdropFilter: 'none'
              }}
            >
              <span className="relative z-10">{user ? '▶ ENTER DASHBOARD ◀' : '▶ START GAME ◀'}</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}