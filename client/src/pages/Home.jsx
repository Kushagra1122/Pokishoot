// Home.jsx
import React, { useContext } from 'react'
import AuthContext from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Joystick, Sword, Users, Trophy } from 'lucide-react'

export default function Home() {
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()

  const features = [
    { icon: Sword, text: 'Epic Battles' },
    { icon: Users, text: 'Live Multiplayer' },
    { icon: Trophy, text: 'Win Rewards' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-blue-900 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-32 h-32 bg-yellow-400 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-60 right-32 w-24 h-24 bg-blue-400 rounded-full blur-2xl animate-pulse delay-75"></div>
        <div className="absolute bottom-40 left-1/3 w-28 h-28 bg-purple-400 rounded-full blur-2xl animate-pulse delay-150"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">
        {/* Logo/Brand */}
        <div className="mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-2xl">
            <Sword className="w-10 h-10 text-white" />
          </div>
        </div>

        {/* Main Title */}
        <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight">
          Pokémon{' '}
          <span className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
            Battle Arena
          </span>
        </h1>

        <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-2xl leading-relaxed">
          Enter the ultimate Pokémon battling experience. Collect, train, and battle in real-time multiplayer arenas!
        </p>

        {/* Features */}
        <div className="flex flex-wrap justify-center gap-8 mb-12">
          {features.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3 text-white/80">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20">
                <Icon className="w-5 h-5" />
              </div>
              <span className="font-semibold">{text}</span>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <button
          onClick={() => navigate(user ? '/dashboard' : '/login')}
          className="group relative px-12 py-4 bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-900 font-bold text-lg rounded-2xl hover:scale-105 transform transition-all duration-300 shadow-2xl hover:shadow-yellow-400/25"
        >
          <div className="flex items-center gap-3">
            <Joystick className="w-6 h-6" />
            {user ? 'Enter Dashboard' : 'Start Adventure'}
          </div>
          <div className="absolute inset-0 rounded-2xl border-2 border-yellow-400/30 group-hover:border-yellow-400/50 transition-colors duration-300"></div>
        </button>

        {/* Stats/Info */}
        <div className="mt-16 grid grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-2xl font-bold text-white">1000+</div>
            <div className="text-gray-400 text-sm">Active Trainers</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">500+</div>
            <div className="text-gray-400 text-sm">Daily Battles</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">150+</div>
            <div className="text-gray-400 text-sm">Pokémon Species</div>
          </div>
        </div>
      </div>
    </div>
  )
}