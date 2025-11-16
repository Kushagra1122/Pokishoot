import React, { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import Web3Context from '../context/Web3Context'
import AuthContext from '../context/AuthContext'
import axios from 'axios'
import { Wallet, Zap, Shield } from 'lucide-react'
import { u8aToHex } from '@polkadot/util'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export default function WalletLogin() {
  const [name, setName] = useState('')
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSigning, setIsSigning] = useState(false)
  const { connectMetaMask, connectPolkadot, isConnected, address, walletType, disconnect } = useContext(Web3Context)
  const { login } = useContext(AuthContext)
  const navigate = useNavigate()

  const handleWalletLogin = async (walletTypeToUse) => {
    try {
      setError(null)
      setIsLoading(true)

      // Connect wallet
      if (!isConnected) {
        if (walletTypeToUse === 'evm') {
          await connectMetaMask()
        } else {
          await connectPolkadot()
        }
      }

      if (!address) {
        setError('Please connect your wallet first')
        return
      }

      // Get nonce from server
      const nonceResponse = await axios.post(`${API_BASE}/api/auth/wallet/nonce`, {
        address: address,
        walletType: walletTypeToUse || walletType || 'evm'
      })

      const { message } = nonceResponse.data

      // Sign message with wallet
      setIsSigning(true)
      let signature

      if (walletTypeToUse === 'evm' || walletType === 'evm') {
        const { ethers } = await import('ethers')
        const provider = new ethers.BrowserProvider(window.ethereum)
        const signer = await provider.getSigner()
        signature = await signer.signMessage(message)
      } else {
        // For Substrate wallets, use Polkadot.js extension
        try {
          const { web3Accounts, web3Enable } = await import('@polkadot/extension-dapp')
          
          // Ensure extension is enabled
          await web3Enable('PokeWars')
          
          // Get accounts
          const accounts = await web3Accounts()
          if (accounts.length === 0) {
            throw new Error('No accounts found in Polkadot.js extension')
          }
          
          // Find the account matching the connected address
          const account = accounts.find(acc => acc.address === address) || accounts[0]
          
          // Sign message with the account
          const extension = await import('@polkadot/extension-dapp')
          const signer = await extension.web3FromAddress(account.address)
          
          if (!signer.signer || !signer.signer.signRaw) {
            throw new Error('Signer not available from extension')
          }
          
          const signed = await signer.signer.signRaw({
            address: account.address,
            data: u8aToHex(new TextEncoder().encode(message)),
            type: 'bytes'
          })
          
          signature = signed.signature
        } catch (err) {
          console.error('Substrate signing error:', err)
          setError(err.message || 'Failed to sign with Substrate wallet')
          setIsSigning(false)
          return
        }
      }

      setIsSigning(false)

      // Login with signature
      const loginResponse = await axios.post(`${API_BASE}/api/auth/wallet/login`, {
        message,
        signature,
        address: address, // Include address for Substrate verification
        walletType: walletTypeToUse || walletType || 'evm',
        name: name.trim() || undefined // Optional name
      })

      const { token, user, needsName } = loginResponse.data

      // Store token and update auth context
      localStorage.setItem('token', token)
      login({ token, user })

      // If user needs to set a name, redirect to name setup
      if (needsName) {
        navigate('/set-name', { state: { fromLogin: true } })
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      console.error('Wallet login error:', err)
      setError(err.response?.data?.message || 'Wallet login failed. Please try again.')
      disconnect()
    } finally {
      setIsLoading(false)
      setIsSigning(false)
    }
  }

  const features = [
    { icon: Wallet, text: 'Web3 Native' },
    { icon: Zap, text: 'No Passwords' },
    { icon: Shield, text: 'Secure & Decentralized' }
  ]

  return (
    <div className="min-h-screen bg-black relative overflow-hidden" style={{
      backgroundImage: `linear-gradient(#0a0a0a 1px, transparent 1px),
                        linear-gradient(90deg, #0a0a0a 1px, transparent 1px)`,
      backgroundSize: '32px 32px',
      backgroundColor: '#000'
    }}>
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
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Side - Branding */}
            <div className="text-center lg:text-left space-y-6">
              <div className="flex justify-center lg:justify-start">
                <img 
                  src="/logo.png" 
                  alt="PokeWars" 
                  className="h-32 md:h-40 lg:h-48 object-contain"
                />
              </div>
              
              <div className="space-y-3">
                {features.map(({ icon: Icon, text }) => {
                  const IconComponent = Icon;
                  return (
                    <div key={text} className="flex items-center gap-3 bg-gray-900/50 px-4 py-3 border-2 border-yellow-400">
                      <div className="w-10 h-10 bg-yellow-400 flex items-center justify-center flex-shrink-0" style={{
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

            {/* Right Side - Wallet Login */}
            <div className="bg-gray-900 border-4 border-yellow-400 p-8 shadow-[0_0_0_8px_rgba(0,0,0,1)] mx-auto w-full max-w-md">
              <h2 className="text-3xl font-black text-center mb-8" style={{ fontFamily: 'monospace' }}>
                <span className="text-green-400">▶</span> <span className='text-yellow-400'>CONNECT WALLET</span> <span className="text-green-400">◀</span>
              </h2>

              {/* Optional Name Input */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-yellow-400 mb-2" style={{ fontFamily: 'monospace' }}>
                  ▸ TRAINER NAME (Optional)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-black border-2 border-gray-700 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-400 transition-all font-bold"
                  placeholder="Enter your name (or set later)"
                  style={{ fontFamily: 'monospace' }}
                  maxLength={20}
                />
                <p className="text-xs text-gray-500 mt-1" style={{ fontFamily: 'monospace' }}>
                  You can set your name now or after login
                </p>
              </div>

              {error && (
                <div className="bg-red-950 border-2 border-red-500 p-4 mb-6">
                  <p className="text-red-400 text-center font-bold" style={{ fontFamily: 'monospace' }}>
                    ⚠ {error}
                  </p>
                </div>
              )}

              {/* Wallet Connection Status */}
              {isConnected && address && (
                <div className="bg-green-950 border-2 border-green-500 p-4 mb-6">
                  <p className="text-green-400 text-center font-bold text-sm" style={{ fontFamily: 'monospace' }}>
                    ✓ Connected: {address.slice(0, 6)}...{address.slice(-4)}
                  </p>
                </div>
              )}

              {/* Wallet Buttons */}
              <div className="space-y-4">
                <button
                  onClick={() => handleWalletLogin('evm')}
                  disabled={isLoading || isSigning}
                  className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-black font-black text-xl tracking-wider hover:from-blue-400 hover:to-cyan-400 transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border-4 border-blue-700"
                  style={{ 
                    fontFamily: 'monospace',
                    boxShadow: '0 8px 0 #1e40af',
                  }}
                >
                  {isSigning ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-4 border-black border-t-transparent animate-spin"></div>
                      SIGNING...
                    </div>
                  ) : isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-4 border-black border-t-transparent animate-spin"></div>
                      CONNECTING...
                    </div>
                  ) : (
                    '▶ META MASK ◀'
                  )}
                </button>

                <button
                  onClick={() => handleWalletLogin('substrate')}
                  disabled={isLoading || isSigning}
                  className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-black font-black text-xl tracking-wider hover:from-purple-400 hover:to-pink-400 transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border-4 border-purple-700"
                  style={{ 
                    fontFamily: 'monospace',
                    boxShadow: '0 8px 0 #7c3aed',
                  }}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-4 border-black border-t-transparent animate-spin"></div>
                      CONNECTING...
                    </div>
                  ) : (
                    '▶ POLKADOT.JS ◀'
                  )}
                </button>
              </div>

              <div className="text-center pt-6 border-t-2 border-gray-800 mt-6">
                <p className="text-gray-400 text-sm" style={{ fontFamily: 'monospace' }}>
                  🔐 Your wallet is your identity
                  <br />
                  No passwords, no accounts to manage
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

