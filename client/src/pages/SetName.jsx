import React, { useState, useContext } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import AuthContext from '../context/AuthContext'
import axios from 'axios'
import { User } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export default function SetName() {
  const [name, setName] = useState('')
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const { token, refreshUser } = useContext(AuthContext)
  const navigate = useNavigate()
  const location = useLocation()

  const handleSetName = async (e) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Name is required')
      return
    }

    if (name.trim().length < 3 || name.trim().length > 20) {
      setError('Name must be between 3 and 20 characters')
      return
    }

    setIsLoading(true)
    try {
      await axios.put(
        `${API_BASE}/api/auth/wallet/set-name`,
        { name: name.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      // Refresh user data
      await refreshUser()

      // Navigate to dashboard or where they came from
      const from = location.state?.from || '/dashboard'
      navigate(from)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to set name. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center p-6" style={{
      backgroundImage: `linear-gradient(#0a0a0a 1px, transparent 1px),
                        linear-gradient(90deg, #0a0a0a 1px, transparent 1px)`,
      backgroundSize: '32px 32px',
      backgroundColor: '#000'
    }}>
      <div className="max-w-md w-full bg-gray-900 border-4 border-yellow-400 p-8 shadow-[0_0_0_8px_rgba(0,0,0,1)]">
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 bg-yellow-400 flex items-center justify-center" style={{
            clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)'
          }}>
            <User className="w-8 h-8 text-black" strokeWidth={3} />
          </div>
        </div>

        <h2 className="text-3xl font-black text-center mb-6" style={{ fontFamily: 'monospace' }}>
          <span className="text-green-400">▶</span> <span className='text-yellow-400'>SET YOUR NAME</span> <span className="text-green-400">◀</span>
        </h2>

        <p className="text-gray-400 text-center mb-6 text-sm" style={{ fontFamily: 'monospace' }}>
          Choose a unique trainer name to display in battles
        </p>

        <form onSubmit={handleSetName} className="space-y-5">
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
              placeholder="Enter your name (3-20 characters)"
              style={{ fontFamily: 'monospace' }}
              minLength={3}
              maxLength={20}
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1" style={{ fontFamily: 'monospace' }}>
              {name.length}/20 characters
            </p>
          </div>

          {error && (
            <div className="bg-red-950 border-2 border-red-500 p-4">
              <p className="text-red-400 text-center font-bold text-sm" style={{ fontFamily: 'monospace' }}>
                ⚠ {error}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || name.trim().length < 3}
            className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-black font-black text-xl tracking-wider hover:from-green-400 hover:to-emerald-400 transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border-4 border-green-700"
            style={{ 
              fontFamily: 'monospace',
              boxShadow: '0 8px 0 #166534',
            }}
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-4 border-black border-t-transparent animate-spin"></div>
                SAVING...
              </div>
            ) : (
              '▶ CONTINUE ◀'
            )}
          </button>

          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="w-full py-2 text-gray-400 hover:text-gray-300 transition-colors text-sm font-bold"
            style={{ fontFamily: 'monospace' }}
          >
            Skip for now →
          </button>
        </form>
      </div>
    </div>
  )
}

