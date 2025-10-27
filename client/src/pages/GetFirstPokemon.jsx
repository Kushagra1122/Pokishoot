// GetFirstPokemon.jsx
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
      } catch (err) {
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
    try {
      await axios.post(
        `${API_BASE}/api/pokemon/claim`,
        { pokemonId: id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await refreshUser();
      navigate("/dashboard");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to claim Pokémon");
    } finally {
      setClaimingId(null);
    }
  };

  const StatRow = ({ label, value, icon: Icon }) => (
    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
      <div className="flex items-center gap-2 text-gray-300">
        <Icon className="w-4 h-4" />
        <span className="text-sm">{label}</span>
      </div>
      <span className="font-bold text-white">{value}</span>
    </div>
  );

  const statIcons = {
    shootRange: Target,
    shootPerMin: Zap,
    hitPoints: Heart,
    speed: Gauge
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-blue-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-24 h-24 bg-amber-400 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-20 h-20 bg-blue-400 rounded-full blur-2xl animate-pulse delay-75"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-purple-400 rounded-full blur-2xl animate-pulse delay-150"></div>
      </div>

      {/* Header */}
      <div className="relative z-10">
        <div className="flex justify-between items-center p-6">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all duration-300"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 px-6 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-2xl">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-4">
            Choose Your <span className="bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">Starter</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Begin your Pokémon journey by selecting your first companion. Each has unique abilities and strengths!
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-16 h-16 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-4"></div>
            <div className="text-xl text-amber-400 font-bold">Loading Pokémon...</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-16 h-16 bg-rose-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-rose-400" />
              </div>
              <div className="text-xl text-rose-400 font-bold mb-2">Error Loading Pokémon</div>
              <p className="text-gray-400">{error}</p>
            </div>
          </div>
        ) : !pokemon.length ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <div className="w-32 h-32 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
              <Star className="w-16 h-16 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">No Starters Available</h3>
            <p className="text-gray-400 mb-8 max-w-md">
              There are currently no starter Pokémon available. Please check back later or contact support.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {pokemon.map((p) => (
              <div
                key={p._id || p.id}
                className="group relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-3xl p-6 border-2 border-amber-400/30 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:border-amber-400/60"
              >
                {/* Pokémon Sprite */}
                <div className="relative mb-6 flex justify-center">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-400/20 to-yellow-500/20 rounded-full blur-2xl group-hover:blur-3xl transition-all duration-500"></div>
                  <div
                    className="relative w-32 h-32 z-10 animate-float"
                    style={{
                      backgroundImage: `url(${p.sprite || "/characters/noChar.png"})`,
                      backgroundPosition: "-5px 0px",
                      backgroundSize: "700px 700px",
                      backgroundRepeat: "no-repeat",
                      imageRendering: "pixelated",
                    }}
                  />
                </div>

                {/* Pokémon Info */}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">{p.name}</h3>
                  <div className="inline-flex items-center gap-2 px-4 py-1 bg-amber-400/20 border border-amber-400/30 rounded-full">
                    <span className="text-sm font-semibold text-amber-400 capitalize">{p.type}</span>
                  </div>
                </div>

                {/* Stats */}
                {p.baseStats && (
                  <div className="space-y-2 mb-6">
                    {Object.entries(statIcons).map(([key, Icon]) => (
                      <StatRow
                        key={key}
                        label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        value={p.baseStats[key] ?? "-"}
                        icon={Icon}
                      />
                    ))}
                  </div>
                )}

                {/* Claim Button */}
                <button
                  onClick={() => claim(p._id)}
                  disabled={!!claimingId}
                  className="group w-full py-4 px-6 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-900 font-bold rounded-xl hover:scale-105 shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
                >
                  <Star className={`w-5 h-5 ${claimingId === p._id ? 'animate-spin' : 'group-hover:scale-110 transition-transform'}`} />
                  {claimingId === p._id ? "Claiming..." : "Choose This Pokémon"}
                  <div className="absolute inset-0 rounded-xl border-2 border-white/20 group-hover:border-white/40 transition-colors duration-300"></div>
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