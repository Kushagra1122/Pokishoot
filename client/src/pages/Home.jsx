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
          {/* Main Title */}
          <h1 className="text-8xl md:text-9xl font-black mb-6 leading-tight" style={{
            fontFamily: 'monospace',
            color: '#fbbf24',
            textShadow: '4px 4px 0 #dc2626, 6px 6px 0 #000'
          }}>
            POKE
            <br />
            <span className="text-red-500">SHOOT</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-green-400 mb-12 max-w-2xl mx-auto leading-relaxed" style={{ fontFamily: 'monospace' }}>
            &gt; ENTER_THE_ARENA.EXE
            <br />
            Battle in real-time multiplayer arenas
          </p>

          {/* Features */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {features.map(({ icon: Icon, text }) => {
              const IconComponent = Icon;
              return (
                <div key={text} className="flex items-center gap-3 bg-gray-900/80 px-6 py-4 border-2 border-yellow-400">
                  <div className="w-12 h-12 bg-yellow-400 flex items-center justify-center" style={{
                    clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)'
                  }}>
                    <IconComponent className="w-6 h-6 text-black" strokeWidth={3} />
                  </div>
                  <span className="font-bold text-white text-lg" style={{ fontFamily: 'monospace' }}>{text}</span>
                </div>
              )
            })}
          </div>

          {/* Action Button */}
          <button
            onClick={() => navigate(user ? '/dashboard' : '/login')}
            className="group relative px-16 py-5 bg-gradient-to-r from-green-500 to-emerald-500 text-black font-black text-2xl tracking-wider hover:from-green-400 hover:to-emerald-400 transform hover:scale-105 transition-all duration-200 border-4 border-green-700 inline-block"
            style={{ 
              fontFamily: 'monospace',
              boxShadow: '0 8px 0 #166534',
            }}
          >
            {user ? '▶ ENTER DASHBOARD ◀' : '▶ START GAME ◀'}
          </button>

          {/* Stats/Info */}
          <div className="mt-16 grid grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-gray-900/50 p-6 border-2 border-blue-500">
              <div className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'monospace' }}>1000+</div>
              <div className="text-gray-400" style={{ fontFamily: 'monospace' }}>Active Trainers</div>
            </div>
            <div className="bg-gray-900/50 p-6 border-2 border-purple-500">
              <div className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'monospace' }}>500+</div>
              <div className="text-gray-400" style={{ fontFamily: 'monospace' }}>Daily Battles</div>
            </div>
            <div className="bg-gray-900/50 p-6 border-2 border-green-500">
              <div className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'monospace' }}>150+</div>
              <div className="text-gray-400" style={{ fontFamily: 'monospace' }}>Pokémon</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}