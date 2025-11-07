import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import AuthContext from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Star, Zap, Heart, Gauge, Target, Sparkles } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

const GetFirstPokemon = () => {
  const { token, refreshUser } = useContext(AuthContext);
  const [pokemon, setPokemon] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [claimingId, setClaimingId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPokemon = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/api/pokemon`);
        const firstClaimable = (res.data.pokemon || []).filter(p => p.isFirstClaim);
        setPokemon(firstClaimable);
      } catch {
        setError("Failed to load Pokémon");
      } finally {
        setLoading(false);
      }
    };
    fetchPokemon();
  }, []);

  const claim = async (id) => {
    if (!token) return navigate("/login");
    setClaimingId(id);
    setError(null);
    try {
      const response = await axios.post(
        `${API_BASE}/api/pokemon/claim`,
        { pokemonId: id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Check if NFT was minted
      if (response.data.nftMinted && response.data.nftTxHash) {
        console.log(`✅ NFT minted! Token ID: ${response.data.nftTokenId}, TX: ${response.data.nftTxHash}`);
      }

      await refreshUser();
      
      // Small delay to show success before navigating
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to claim Pokémon");
    } finally {
      setClaimingId(null);
    }
  };

  const statIcons = {
    shootRange: Target,
    shootPerMin: Zap,
    hitPoints: Heart,
    speed: Gauge
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden" style={{
      backgroundImage: `linear-gradient(#0a0a0a 1px, transparent 1px),
                        linear-gradient(90deg, #0a0a0a 1px, transparent 1px)`,
      backgroundSize: '32px 32px',
      backgroundColor: '#000'
    }}>
      {/* Subtle Animated Background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-24 h-24 bg-yellow-400" style={{
          clipPath: 'polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)',
          filter: 'blur(20px)'
        }}></div>
        <div className="absolute bottom-20 right-20 w-20 h-20 bg-blue-400" style={{
          clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
          filter: 'blur(20px)'
        }}></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-purple-400" style={{
          clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
          filter: 'blur(20px)'
        }}></div>
      </div>

      {/* Header */}
      <div className="relative z-10">
        <div className="flex justify-between items-center p-6 border-b-2 border-yellow-400">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 border-2 border-gray-700 text-white hover:border-yellow-400 transition-all"
            style={{ fontFamily: 'monospace' }}
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={3} />
            ← BACK
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 px-6 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-yellow-400 mx-auto mb-6 flex items-center justify-center" style={{
            clipPath: 'polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)',
            boxShadow: '0 8px 0 #d97706'
          }}>
            <Sparkles className="w-10 h-10 text-black" strokeWidth={3} />
          </div>
          <h1 className="text-6xl md:text-7xl font-black mb-4" style={{
            fontFamily: 'monospace',
            color: '#fbbf24',
            textShadow: '3px 3px 0 #dc2626, 5px 5px 0 #000'
          }}>
            CHOOSE STARTER
          </h1>
          <p className="text-xl text-green-400 max-w-2xl mx-auto" style={{ fontFamily: 'monospace' }}>
            &gt; GET_FIRST_POKEMON.EXE
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent animate-spin mb-4"></div>
            <div className="text-xl text-yellow-400 font-black" style={{ fontFamily: 'monospace' }}>LOADING...</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-950 border-4 border-red-500 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-red-400" strokeWidth={3} />
              </div>
              <div className="text-xl text-red-400 font-black mb-2" style={{ fontFamily: 'monospace' }}>ERROR</div>
              <p className="text-gray-400" style={{ fontFamily: 'monospace' }}>{error}</p>
            </div>
          </div>
        ) : !pokemon.length ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <div className="w-32 h-32 bg-gray-900 border-4 border-yellow-400 mb-6 flex items-center justify-center" style={{
              clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)'
            }}>
              <Star className="w-16 h-16 text-yellow-400" strokeWidth={3} />
            </div>
            <h3 className="text-2xl font-black text-white mb-4" style={{ fontFamily: 'monospace' }}>NO STARTERS</h3>
            <p className="text-gray-400 mb-8 max-w-md" style={{ fontFamily: 'monospace' }}>
              CHECK BACK LATER!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {pokemon.map((p) => (
              <div
                key={p._id || p.id}
                className="group relative bg-gray-900 p-6 border-4 border-yellow-400 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(250,204,21,0.5)]"
                style={{ fontFamily: 'monospace' }}
              >
                {/* Pokémon Sprite */}
                <div className="relative mb-6 flex justify-center">
                  <div className="w-40 h-40 border-4 border-blue-500 bg-gray-950">
                    <div
                      className="relative w-full h-full"
                      style={{
                        backgroundImage: `url(${p.sprite || "/characters/noChar.png"})`,
                        backgroundPosition: "-5px 0px",
                        backgroundSize: "700px 700px",
                        backgroundRepeat: "no-repeat",
                        imageRendering: "pixelated",
                      }}
                    />
                  </div>
                </div>

                {/* Pokémon Info */}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-black text-white mb-2">{p.name?.toUpperCase()}</h3>
                  <div className="inline-flex items-center gap-2 px-4 py-1 bg-gray-800 border-2 border-yellow-400">
                    <span className="text-sm font-black text-yellow-400">{p.type?.toUpperCase()}</span>
                  </div>
                </div>

                {/* Stats */}
                {p.baseStats && (
                  <div className="space-y-2 mb-6">
                    {Object.entries(statIcons).map(([key, IconComp]) => {
                      const Icon = IconComp;
                      return (
                        <div key={key} className="flex items-center justify-between p-2 bg-gray-800 border border-gray-600">
                          <div className="flex items-center gap-2 text-gray-300">
                            <Icon className="w-4 h-4" strokeWidth={3} />
                            <span className="text-xs font-bold">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).substring(0, 12)}</span>
                          </div>
                          <span className="font-black text-white">{p.baseStats[key] ?? "-"}</span>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Claim Button */}
                <button
                  onClick={() => claim(p._id)}
                  disabled={!!claimingId}
                  className="group w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-black font-black border-4 border-green-700 hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
                  style={{ fontFamily: 'monospace', boxShadow: '0 6px 0 #166534' }}
                >
                  <Star className="w-5 h-5" strokeWidth={3} />
                  {claimingId === p._id ? "CLAIMING..." : "CLAIM"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GetFirstPokemon;