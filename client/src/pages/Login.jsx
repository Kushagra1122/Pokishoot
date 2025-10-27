import React, { useState, useContext } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import AuthContext from '../context/AuthContext'
import { Sword, Users, Trophy } from 'lucide-react'

export default function Login() {
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useContext(AuthContext)
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    try {
      await login({ name, password })
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  const features = [
    { icon: Sword, text: 'Battle Arena' },
    { icon: Users, text: 'Join Teams' },
    { icon: Trophy, text: 'Win Rankings' }
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
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
        <div className="max-w-5xl w-full">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Left Side - Branding */}
            <div className="text-center lg:text-left space-y-6">
              <h1 className="text-6xl md:text-8xl font-black leading-tight" style={{
                fontFamily: 'monospace',
                color: '#fbbf24',
                textShadow: '4px 4px 0 #dc2626, 6px 6px 0 #000'
              }}>
                POKE
                <br />
                <span className="text-red-500">SHOOT</span>
              </h1>
              
              <div className="space-y-3">
                {features.map(({ icon: Icon, text }) => {
                  const IconComponent = Icon;
                  return (
                    <div key={text} className="flex items-center gap-3 bg-gray-900/50 px-4 py-3 border-2 border-yellow-400">
                      <div className="w-10 h-10 bg-yellow-400 flex items-center justify-center" style={{
                        clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)'
                      }}>
                        <IconComponent className="w-5 h-5 text-black" strokeWidth={3} />
                      </div>
                      <span className="font-bold text-white" style={{ fontFamily: 'monospace' }}>{text}</span>
                    </div>
                  )
                })}
              </div>

              
            </div>

            {/* Right Side - Form */}
            <div className="bg-gray-900 border-4 border-yellow-400 p-8 shadow-[0_0_0_8px_rgba(0,0,0,1)]">
              <h2 className="text-3xl font-black text-center mb-8" style={{ fontFamily: 'monospace' }}>
                <span className="text-green-400">▶</span> <span className='text-yellow-400'>CONTINUE</span> <span className="text-green-400">◀</span>
              </h2>

              <form onSubmit={submit} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-yellow-400 mb-2" style={{ fontFamily: 'monospace' }}>
                    ▸ TRAINER NAME
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-black border-2 border-gray-700 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-400 transition-all font-bold"
                    placeholder="Enter your name"
                    style={{ fontFamily: 'monospace' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-yellow-400 mb-2" style={{ fontFamily: 'monospace' }}>
                    ▸ PASSWORD
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-black border-2 border-gray-700 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-400 transition-all font-bold"
                    placeholder="••••••••"
                    style={{ fontFamily: 'monospace' }}
                  />
                </div>

                {error && (
                  <div className="bg-red-950 border-2 border-red-500 p-4">
                    <p className="text-red-400 text-center font-bold" style={{ fontFamily: 'monospace' }}>
                      ⚠ {error}
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-black font-black text-xl tracking-wider hover:from-green-400 hover:to-emerald-400 transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border-4 border-green-700"
                  style={{ 
                    fontFamily: 'monospace',
                    boxShadow: '0 8px 0 #166534',
                  }}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-4 border-black border-t-transparent animate-spin"></div>
                      LOADING...
                    </div>
                  ) : (
                    '▶ LOGIN ◀'
                  )}
                </button>

                <div className="text-center pt-4 border-t-2 border-gray-800">
                  <p className="text-gray-400" style={{ fontFamily: 'monospace' }}>
                    New player?{' '}
                    <Link to="/signup" className="text-cyan-400 hover:text-cyan-300 transition-colors font-bold">
                      SIGNUP →
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}