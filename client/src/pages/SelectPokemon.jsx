import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import { Star, ArrowLeft, Zap, Heart, Gauge, Target, Sparkles, Crown } from "lucide-react";

const SelectPokemon = () => {
  const { user, selectPokemon, selectedPokemon } = useContext(AuthContext);
  const navigate = useNavigate();
  const pokes = user?.pokemon || [];

  const handleSelect = (p) => {
    const payload = { ...p.pokemonId, level: p.level, _id: p._id };
    selectPokemon(payload);
    navigate("/dashboard");
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
          
          <div className="text-right">
            <div className="text-sm text-gray-400" style={{ fontFamily: 'monospace' }}>SELECTED</div>
            <div className="text-lg font-black text-yellow-400" style={{ fontFamily: 'monospace' }}>
              {selectedPokemon?.name?.toUpperCase() || 'NONE'}
            </div>
          </div>
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
            <Crown className="w-10 h-10 text-black" strokeWidth={3} />
          </div>
          <h1 className="text-6xl md:text-7xl font-black mb-4" style={{
            fontFamily: 'monospace',
            color: '#fbbf24',
            textShadow: '3px 3px 0 #dc2626, 5px 5px 0 #000'
          }}>
            CHOOSE CHAMPION
          </h1>
          <p className="text-xl text-green-400 max-w-2xl mx-auto" style={{ fontFamily: 'monospace' }}>
            &gt; SELECT_POKEMON.EXE
          </p>
        </div>

        {/* Pokémon Grid */}
        {pokes.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <div className="w-32 h-32 bg-gray-900 border-4 border-yellow-400 mb-6 flex items-center justify-center" style={{
              clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)'
            }}>
              <Star className="w-16 h-16 text-yellow-400" strokeWidth={3} />
            </div>
            <h3 className="text-2xl font-black text-white mb-4" style={{ fontFamily: 'monospace' }}>NO POKEMON</h3>
            <p className="text-gray-400 mb-8 max-w-md" style={{ fontFamily: 'monospace' }}>
              VISIT MARKETPLACE TO GET YOUR FIRST POKEMON!
            </p>
            <button
              onClick={() => navigate('/market-place')}
              className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-black font-black border-4 border-green-700 hover:scale-105 transition-transform"
              style={{ fontFamily: 'monospace', boxShadow: '0 6px 0 #166534' }}
            >
              GET POKEMON
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {pokes.map((p) => {
              const pk = p.pokemonId || {};
              const isSelected = selectedPokemon && String(selectedPokemon._id) === String(p._id);

              return (
                <div
                  key={p._id}
                  className={`group relative bg-gray-900 p-6 border-4 transition-all duration-300 ${
                    isSelected 
                      ? 'border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.5)]' 
                      : 'border-gray-700 hover:border-yellow-400 hover:scale-105'
                  }`}
                  style={{ fontFamily: 'monospace' }}
                >
                  {/* Selection Badge */}
                  {isSelected && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 px-6 py-1 bg-yellow-400 text-black font-black border-2 border-yellow-600">
                      SELECTED
                    </div>
                  )}

                  {/* Pokémon Sprite */}
                  <div className="relative mb-6 flex justify-center">
                    <div className="w-40 h-40 border-4 border-blue-500 bg-gray-950">
                      <div
                        className="relative w-full h-full"
                        style={{
                          backgroundImage: `url(${pk.sprite || "/characters/noChar.png"})`,
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
                    <h3 className="text-2xl font-black text-white mb-2">{pk.name?.toUpperCase()}</h3>
                    <div className="inline-flex items-center gap-2 px-4 py-1 bg-gray-800 border-2 border-yellow-400">
                      <span className="text-sm font-black text-yellow-400">{pk.type?.toUpperCase()}</span>
                      <span className="text-xs text-gray-300">LVL {p.level}</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="space-y-2 mb-6">
                    {Object.entries(statIcons).map(([key, IconComp]) => {
                      const Icon = IconComp;
                      return (
                        <div key={key} className="flex items-center justify-between p-2 bg-gray-800 border border-gray-600">
                          <div className="flex items-center gap-2 text-gray-300">
                            <Icon className="w-4 h-4" strokeWidth={3} />
                            <span className="text-xs font-bold">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).substring(0, 12)}</span>
                          </div>
                          <span className="font-black text-white">{pk.baseStats?.[key] ?? "-"}</span>
                        </div>
                      )
                    })}
                  </div>

                  {/* Select Button */}
                  <button
                    onClick={() => handleSelect(p)}
                    disabled={isSelected}
                    className={`group w-full py-4 font-black transition-all duration-300 flex items-center justify-center gap-2 ${
                      isSelected
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed border-4 border-gray-600'
                        : 'bg-gradient-to-r from-green-500 to-emerald-500 text-black border-4 border-green-700 hover:scale-105'
                    }`}
                    style={{ fontFamily: 'monospace', boxShadow: isSelected ? '' : '0 6px 0 #166534' }}
                  >
                    {isSelected ? (
                      <>
                        <Sparkles className="w-5 h-5" strokeWidth={3} />
                        SELECTED
                      </>
                    ) : (
                      <>
                        <Star className="w-5 h-5" strokeWidth={3} />
                        SELECT
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SelectPokemon;