// Login.jsx
import React, { useState, useContext } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import AuthContext from '../context/AuthContext'
import { LogIn, Sword, Users, Trophy } from 'lucide-react'

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
    { icon: Sword, text: 'Real-time Pokémon Battles' },
    { icon: Users, text: 'Global Multiplayer' },
    { icon: Trophy, text: 'Compete for Rankings' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-blue-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-32 h-32 bg-amber-400 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-32 right-20 w-24 h-24 bg-blue-400 rounded-full blur-2xl animate-pulse delay-75"></div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl w-full items-center">
          {/* Left Side - Branding */}
          <div className="text-center lg:text-left">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-2xl mx-auto lg:mx-0 mb-6 flex items-center justify-center shadow-2xl">
              <LogIn className="w-10 h-10 text-white" />
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
              Welcome <span className="bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">Back</span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Sign in to continue your Pokémon journey. Battle, trade, and become the ultimate champion!
            </p>

            {/* Features */}
            <div className="space-y-4">
              {features.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3 text-white/80">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="font-semibold">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-3xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-2 text-center">Welcome Back</h2>
            <p className="text-gray-400 text-center mb-8">Sign in to your account</p>

            <form onSubmit={submit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-white mb-2">Trainer Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all duration-300"
                  placeholder="Enter your trainer name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all duration-300"
                  placeholder="Enter your password"
                />
              </div>

              {error && (
                <div className="p-4 bg-rose-500/20 border border-rose-500/30 rounded-xl text-rose-400 text-center animate-pulse">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="group w-full py-4 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-900 font-bold rounded-xl hover:scale-105 transform transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-2xl"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                    Signing In...
                  </div>
                ) : (
                  'Sign In to Your Account'
                )}
              </button>

              <p className="text-center text-gray-400">
                New trainer?{' '}
                <Link to="/signup" className="text-amber-400 font-bold hover:text-amber-300 transition-colors duration-300">
                  Create an account
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}