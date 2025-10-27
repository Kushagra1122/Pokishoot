// SelectPokemon.jsx
import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import { Star, ArrowLeft, Zap, Heart, Gauge, Target } from "lucide-react";

const StatRow = ({ label, value, icon: Icon }) => (
  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
    <div className="flex items-center gap-2 text-gray-300">
      <Icon className="w-4 h-4" />
      <span className="text-sm">{label}</span>
    </div>
    <span className="font-bold text-white">{value}</span>
  </div>
);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-blue-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-24 h-24 bg-amber-400 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-20 h-20 bg-blue-400 rounded-full blur-2xl animate-pulse delay-75"></div>
      </div>

      {/* Header */}
      <div className="relative z-10">
        <div className="flex items-center justify-between p-6">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all duration-300"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
          
          <div className="text-right">
            <div className="text-sm text-gray-400">Currently Selected</div>
            <div className="text-lg font-bold text-white">
              {selectedPokemon?.name || 'None'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 px-6 py-8">
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-black text-white mb-4">
            Choose Your <span className="bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">Champion</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Select your Pokémon companion for battle. Each has unique strengths and abilities!
          </p>
        </div>

        {/* Pokémon Grid */}
        {pokes.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <div className="w-32 h-32 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
              <Star className="w-16 h-16 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">No Pokémon Available</h3>
            <p className="text-gray-400 mb-8 max-w-md">
              You haven't acquired any Pokémon yet. Visit the marketplace or get your first Pokémon to start battling!
            </p>
            <button
              onClick={() => navigate('/market-place')}
              className="px-8 py-3 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-900 font-bold rounded-xl hover:scale-105 transition-transform duration-300"
            >
              Get Your First Pokémon
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
                  className={`group relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-3xl p-6 border-2 transition-all duration-500 hover:scale-105 hover:shadow-2xl ${
                    isSelected 
                      ? 'border-amber-400 shadow-amber-400/20' 
                      : 'border-white/10 hover:border-amber-400/30'
                  }`}
                >
                  {/* Selection Badge */}
                  {isSelected && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-900 font-bold rounded-full text-sm shadow-lg">
                      SELECTED
                    </div>
                  )}

                  {/* Pokémon Sprite */}
                  <div className="relative mb-6 flex justify-center">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-400/20 to-yellow-500/20 rounded-full blur-2xl group-hover:blur-3xl transition-all duration-500"></div>
                    <div
                      className="relative w-32 h-32 z-10 animate-float"
                      style={{
                        backgroundImage: `url(${pk.sprite || "/characters/noChar.png"})`,
                        backgroundPosition: "-5px 0px",
                        backgroundSize: "700px 700px",
                        backgroundRepeat: "no-repeat",
                        imageRendering: "pixelated",
                      }}
                    />
                  </div>

                  {/* Pokémon Info */}
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-white mb-2">{pk.name}</h3>
                    <div className="inline-flex items-center gap-2 px-4 py-1 bg-amber-400/20 border border-amber-400/30 rounded-full">
                      <span className="text-sm font-semibold text-amber-400 capitalize">{pk.type}</span>
                      <span className="text-xs text-gray-300">Lvl {p.level}</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="space-y-2 mb-6">
                    {Object.entries(statIcons).map(([key, Icon]) => (
                      <StatRow
                        key={key}
                        label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        value={pk.baseStats?.[key] ?? "-"}
                        icon={Icon}
                      />
                    ))}
                  </div>

                  {/* Select Button */}
                  <button
                    onClick={() => handleSelect(p)}
                    disabled={isSelected}
                    className={`group w-full py-3 px-4 font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
                      isSelected
                        ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-gray-700 cursor-not-allowed'
                        : 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-900 hover:scale-105 hover:shadow-lg'
                    }`}
                  >
                    <Star className={`w-5 h-5 ${isSelected ? '' : 'group-hover:scale-110 transition-transform'}`} />
                    {isSelected ? 'Currently Selected' : 'Select Pokémon'}
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