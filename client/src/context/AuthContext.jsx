import React, { createContext, useState, useEffect } from 'react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE || 'http://localhost:4000'
const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [selectedPokemon, setSelectedPokemon] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('token'))

  // ✅ Load user when token exists
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token)
      axios
        .get(`${API_BASE}/api/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => {
          const fetchedUser = res.data.user
          setUser(fetchedUser)
          // if user has pokemon and none is selected yet, set first
          if (fetchedUser?.pokemon?.length && !selectedPokemon) {
            const first = fetchedUser.pokemon[0]
            setSelectedPokemon({
              ...first.pokemonId,
              level: first.level,
            })
          }
        })
        .catch(() => {
          setToken(null)
          setUser(null)
          setSelectedPokemon(null)
        })
    } else {
      localStorage.removeItem('token')
      setUser(null)
      setSelectedPokemon(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  // ✅ Helper to re-fetch user and sync Pokémon selection
  const refreshUser = async () => {
    if (!token) return null
    try {
      const res = await axios.get(`${API_BASE}/api/me`, { headers: { Authorization: `Bearer ${token}` } })
      const updatedUser = res.data.user
      setUser(updatedUser)
      // If user has Pokémon but selectedPokemon is null or no longer valid → default to first
      if (updatedUser?.pokemon?.length) {
        const stillHasSelected = updatedUser.pokemon.some(
          (p) => p._id === selectedPokemon?._id
        )
        if (!stillHasSelected) {
          const first = updatedUser.pokemon[0]
          setSelectedPokemon({
            ...first.pokemonId,
            level: first.level,
          })
        }
      } else {
        setSelectedPokemon(null)
      }

      return updatedUser
    } catch (e) {
      console.error('refreshUser error', e)
      setToken(null)
      setUser(null)
      setSelectedPokemon(null)
      return null
    }
  }

  // ✅ Signup
  const signup = async ({ name, password }) => {
    const res = await axios.post(`${API_BASE}/api/signup`, { name, password })
    setToken(res.data.token)
    setUser(res.data.user)
    setSelectedPokemon(null)
    return res.data
  }

  // ✅ Login
  const login = async ({ name, password }) => {
    const res = await axios.post(`${API_BASE}/api/login`, { name, password })
    const loggedUser = res.data.user

    setToken(res.data.token)
    setUser(loggedUser)

    // Auto-select first Pokémon if available
    const first = loggedUser?.pokemon?.[0]
    setSelectedPokemon(
      first ? { ...first.pokemonId, level: first.level, _id: first._id } : null
    )

    return res.data
  }

  // ✅ Logout
  const logout = () => {
    setToken(null)
    setUser(null)
    setSelectedPokemon(null)
  }

  // ✅ Manual selection
  const selectPokemon = (pokemonObj) => {
    setSelectedPokemon(pokemonObj)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        signup,
        login,
        logout,
        refreshUser,
        selectedPokemon,
        selectPokemon,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext
