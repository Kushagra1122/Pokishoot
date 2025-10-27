// MarketPlace.jsx
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { ArrowLeft, ShoppingCart, Star, Coins, Zap, TrendingUp, TrendingDown, Target, Heart, Gauge, X, Plus } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

const MarketPlace = () => {
  const { user, token, refreshUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [pokemon, setPokemon] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [purchasingId, setPurchasingId] = useState(null);
  const [sortBy, setSortBy] = useState('name');
  const [activeTab, setActiveTab] = useState('buy');
  const [showSellModal, setShowSellModal] = useState(false);
  const [selectedPokemonToSell, setSelectedPokemonToSell] = useState(null);
  const [sellPrice, setSellPrice] = useState('');
  const [selling, setSelling] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPokemonToUpgrade, setSelectedPokemonToUpgrade] = useState(null);
  const [upgrading, setUpgrading] = useState(false);
  const [myListings, setMyListings] = useState([]);
  const [showMyListings, setShowMyListings] = useState(false);

  const hasUserPokemon = user?.pokemon && user.pokemon.length > 0;
  const userPokemonIds = user?.pokemon?.map(p => String(p.pokemonId._id || p.pokemonId)) || [];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pokemonRes, listingsRes] = await Promise.all([
        axios.get(`${API_BASE}/api/pokemon`),
        axios.get(`${API_BASE}/api/pokemon/listings`)
      ]);
      setPokemon(pokemonRes.data.pokemon || []);
      setListings(listingsRes.data.listings || []);
      setError(null);
    } catch (error) {
      setError(error?.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyListings = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/pokemon/my-listings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyListings(res.data.listings || []);
    } catch (err) {
      console.error('Error fetching my listings:', err);
    }
  }, [token]);

  useEffect(() => {
    if (activeTab === 'sell' && token) {
      fetchMyListings();
    }
  }, [activeTab, token, fetchMyListings]);

  const purchase = async (id, price) => {
    if (!token) return navigate('/login');
    setPurchasingId(id);
    try {
      await axios.post(
        `${API_BASE}/api/pokemon/purchase`,
        { pokemonId: id, price },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      await refreshUser();
      setSuccess('Pokémon purchased successfully!');
      setTimeout(() => setSuccess(null), 3000);
      setError(null);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to purchase Pokémon');
    } finally {
      setPurchasingId(null);
    }
  };

  const handleListForSale = async () => {
    if (!selectedPokemonToSell || !sellPrice) {
      setError('Please select a Pokémon and enter a price');
      return;
    }

    if (parseFloat(sellPrice) <= 0) {
      setError('Price must be greater than 0');
      return;
    }

    setSelling(true);
    try {
      await axios.post(
        `${API_BASE}/api/pokemon/list-for-sale`,
        { pokemonId: selectedPokemonToSell._id, price: parseFloat(sellPrice) },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      setSuccess('Pokémon listed for sale successfully!');
      setTimeout(() => setSuccess(null), 3000);
      setShowSellModal(false);
      setSelectedPokemonToSell(null);
      setSellPrice('');
      setError(null);
      await fetchMyListings();
      await refreshUser();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to list Pokémon');
    } finally {
      setSelling(false);
    }
  };

  const handleUpgradeLevel = async () => {
    if (!selectedPokemonToUpgrade) {
      setError('Please select a Pokémon');
      return;
    }

    setUpgrading(true);
    try {
      await axios.post(
        `${API_BASE}/api/pokemon/upgrade-level`,
        { pokemonId: selectedPokemonToUpgrade._id },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      setSuccess('Level upgraded successfully!');
      setTimeout(() => setSuccess(null), 3000);
      await refreshUser();
      setShowUpgradeModal(false);
      setSelectedPokemonToUpgrade(null);
      setError(null);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to upgrade level');
    } finally {
      setUpgrading(false);
    }
  };

  const handleBuyFromListing = async (listingId) => {
    if (!token) return navigate('/login');
    setPurchasingId(listingId);
    try {
      await axios.post(
        `${API_BASE}/api/pokemon/buy-from-listing`,
        { listingId },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      setSuccess('Pokémon purchased from listing!');
      setTimeout(() => setSuccess(null), 3000);
      await refreshUser();
      await fetchData();
      setError(null);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to purchase from listing');
    } finally {
      setPurchasingId(null);
    }
  };

  const handleCancelListing = async (listingId) => {
    try {
      await axios.post(
        `${API_BASE}/api/pokemon/cancel-listing`,
        { listingId },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      setSuccess('Listing cancelled');
      setTimeout(() => setSuccess(null), 3000);
      await fetchMyListings();
      await refreshUser();
      setError(null);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to cancel listing');
    }
  };

  const availablePokemon = pokemon.filter(p => !userPokemonIds.includes(String(p._id)));
  
  // Deduplicate userOwnedPokemon by pokemonId, keeping the highest level
  const userOwnedPokemon = user?.pokemon?.reduce((uniquePokemon, p) => {
    const pokemonId = String(p.pokemonId._id);
    const existing = uniquePokemon.find(up => String(up._id) === pokemonId);
    
    if (!existing) {
      uniquePokemon.push({
        ...p.pokemonId,
        userLevel: p.level,
        _id: p.pokemonId._id
      });
    } else if (p.level > existing.userLevel) {
      // If this copy has a higher level, update it
      existing.userLevel = p.level;
    }
    
    return uniquePokemon;
  }, []) || [];

  const getDisplayedPokemon = () => {
    let data = availablePokemon;
    return data.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'price') return (a.price || 0) - (b.price || 0);
      if (sortBy === 'type') return a.type.localeCompare(b.type);
      return 0;
    });
  };

  const displayedPokemon = getDisplayedPokemon();

  const StatRow = ({ label, value }) => (
    <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
      <div className="flex items-center gap-2 text-gray-300">
        <Gauge className="w-3 h-3" />
        <span className="text-xs">{label}</span>
      </div>
      <span className="font-bold text-white text-sm">{value}</span>
    </div>
  );

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
        <div className="absolute top-10 left-10 w-20 h-20 bg-yellow-400" style={{
          clipPath: 'polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)',
          filter: 'blur(20px)'
        }}></div>
        <div className="absolute bottom-20 right-20 w-16 h-16 bg-blue-400" style={{
          clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
          filter: 'blur(20px)'
        }}></div>
        <div className="absolute top-1/3 right-1/3 w-24 h-24 bg-purple-400" style={{
          clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
          filter: 'blur(20px)'
        }}></div>
      </div>

      {/* Header */}
      <div className="relative z-10">
        <div className="flex justify-between items-center p-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 border-2 border-yellow-400 text-yellow-400 hover:border-green-400 transition-all duration-300"
            style={{ fontFamily: 'monospace' }}
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-bold">BACK TO DASHBOARD</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 px-6 py-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-green-500 mx-auto mb-6 flex items-center justify-center border-4 border-green-700" style={{
            clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
            boxShadow: '0 8px 0 #166534'
          }}>
            <ShoppingCart className="w-10 h-10 text-black" strokeWidth={3} />
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-4 leading-tight" style={{
            fontFamily: 'monospace',
            color: '#fbbf24',
            textShadow: '3px 3px 0 #dc2626, 5px 5px 0 #000'
          }}>
            MARKETPLACE
          </h1>
          <p className="text-xl text-green-400 max-w-2xl mx-auto" style={{ fontFamily: 'monospace' }}>
            &gt; TRADE.EXE | BUY • SELL • UPGRADE
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-4 mb-8 flex-wrap">
          <button
            onClick={() => setActiveTab('buy')}
            className={`flex items-center gap-3 px-6 py-3 font-bold transition-all transform ${
              activeTab === 'buy'
                ? 'bg-green-500 text-black border-4 border-green-700 scale-105'
                : 'bg-gray-900 border-2 border-gray-700 text-yellow-400 hover:border-yellow-400'
            }`}
            style={{ fontFamily: 'monospace', boxShadow: activeTab === 'buy' ? '0 8px 0 #166534' : 'none' }}
          >
            <TrendingDown className="w-5 h-5" />
            BUY POKEMON
          </button>

          {hasUserPokemon && (
            <>
              <button
                onClick={() => setActiveTab('sell')}
                className={`flex items-center gap-3 px-6 py-3 font-bold transition-all transform ${
                  activeTab === 'sell'
                    ? 'bg-blue-500 text-white border-4 border-blue-700 scale-105'
                    : 'bg-gray-900 border-2 border-gray-700 text-yellow-400 hover:border-yellow-400'
                }`}
                style={{ fontFamily: 'monospace', boxShadow: activeTab === 'sell' ? '0 8px 0 #1e40af' : 'none' }}
              >
                <TrendingUp className="w-5 h-5" />
                YOUR COLLECTION
              </button>

              <button
                onClick={() => setActiveTab('marketplace')}
                className={`flex items-center gap-3 px-6 py-3 font-bold transition-all transform ${
                  activeTab === 'marketplace'
                    ? 'bg-rose-500 text-white border-4 border-rose-700 scale-105'
                    : 'bg-gray-900 border-2 border-gray-700 text-yellow-400 hover:border-yellow-400'
                }`}
                style={{ fontFamily: 'monospace', boxShadow: activeTab === 'marketplace' ? '0 8px 0 #991b1b' : 'none' }}
              >
                <Coins className="w-5 h-5" />
                MARKETPLACE
              </button>
            </>
          )}

          {!hasUserPokemon && (
            <div className="px-6 py-3 bg-gray-900 border-2 border-gray-700 text-gray-500 font-bold flex items-center gap-3" style={{ fontFamily: 'monospace' }}>
              <TrendingUp className="w-5 h-5" />
              <span>GET POKEMON TO SELL</span>
            </div>
          )}
        </div>

        {/* Filters */}
        {activeTab === 'buy' && (
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-4 bg-gray-900 border-2 border-gray-700 px-6 py-3" style={{ fontFamily: 'monospace' }}>
              <span className="text-yellow-400 font-bold">SORT BY:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 bg-black border-2 border-yellow-400 text-yellow-400 font-bold focus:outline-none focus:border-green-400"
                style={{ fontFamily: 'monospace' }}
              >
                <option value="name">NAME</option>
                <option value="price">PRICE</option>
                <option value="type">TYPE</option>
              </select>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-green-900 border-4 border-green-500 text-green-400 text-center max-w-md font-bold" style={{ fontFamily: 'monospace' }}>
              ✓ {success}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-red-900 border-4 border-red-500 text-red-400 text-center max-w-md font-bold animate-pulse" style={{ fontFamily: 'monospace' }}>
              ⚠ {error}
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent animate-spin mb-4"></div>
            <div className="text-xl text-yellow-400 font-bold" style={{ fontFamily: 'monospace' }}>LOADING...</div>
          </div>
        ) : (
          <div>
            {/* Buy Tab */}
            {activeTab === 'buy' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {displayedPokemon.length > 0 ? (
                  displayedPokemon.map((p) => (
                    <div
                      key={p._id || p.id}
                      className="group relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-3xl p-6 border-2 border-emerald-400/30 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:border-emerald-400/60"
                    >
                      {/* Pokémon Sprite */}
                      <div className="relative mb-6 flex justify-center">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-green-500/20 rounded-full blur-2xl group-hover:blur-3xl transition-all duration-500"></div>
                        <div
                          className="relative w-32 h-32 z-10 animate-float"
                          style={{
                            backgroundImage: `url(${p.sprite || '/characters/noChar.png'})`,
                            backgroundPosition: '-5px 0px',
                            backgroundSize: '700px 700px',
                            backgroundRepeat: 'no-repeat',
                            imageRendering: 'pixelated',
                          }}
                        />
                      </div>

                      {/* Pokémon Info */}
                      <div className="text-center mb-6">
                        <h3 className="text-xl font-bold text-white mb-2">{p.name}</h3>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-400/20 border border-emerald-400/30 rounded-full">
                          <span className="text-sm font-semibold text-emerald-400 capitalize">{p.type}</span>
                        </div>
                      </div>

                      {/* Stats */}
                      {p.baseStats && (
                        <div className="space-y-2 mb-6">
                          {Object.entries(statIcons).map(([key]) => (
                            <StatRow
                              key={key}
                              label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                              value={p.baseStats[key] ?? "-"}
                            />
                          ))}
                        </div>
                      )}

                      {/* Price & Action */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold text-lg">
                          <Coins className="w-5 h-5" />
                          {p.price?.toFixed(2) || '0.50'} ETH
                        </div>

                        <button
                          onClick={() => purchase(p._id, p.price)}
                          disabled={!!purchasingId || !user}
                          className="group w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold rounded-xl hover:scale-105 shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
                        >
                          <ShoppingCart className={`w-4 h-4 ${purchasingId === p._id ? 'animate-spin' : 'group-hover:scale-110 transition-transform'}`} />
                          {purchasingId === p._id ? 'Purchasing...' : 'Add to Team'}
                          <div className="absolute inset-0 rounded-xl border-2 border-white/20 group-hover:border-white/40 transition-colors duration-300"></div>
                        </button>

                        {!user && (
                          <p className="text-rose-400 text-sm text-center">Login required to purchase</p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full flex flex-col items-center justify-center min-h-[400px] text-center">
                    <div className="w-32 h-32 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                      <ShoppingCart className="w-16 h-16 text-gray-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4">Market Empty</h3>
                    <p className="text-gray-400 max-w-md">
                      All available Pokémon have been claimed! Check back later for new additions.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Sell/Collection Tab */}
            {activeTab === 'sell' && (
              <div>
                <div className="mb-8 flex justify-center">
                  <button
                    onClick={() => setShowMyListings(!showMyListings)}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all duration-300"
                  >
                    <Coins className="w-5 h-5" />
                    {showMyListings ? 'Hide' : 'Show'} My Active Listings
                  </button>
                </div>

                {showMyListings && myListings.length > 0 && (
                  <div className="mb-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {myListings.map((listing) => (
                      <div
                        key={listing._id}
                        className="group relative bg-gradient-to-br from-yellow-500/10 to-yellow-400/5 backdrop-blur-sm rounded-3xl p-6 border-2 border-yellow-400/30"
                      >
                        <div className="absolute top-3 right-3 px-3 py-1 bg-yellow-500/30 rounded-full text-yellow-300 text-xs font-bold">
                          Listed
                        </div>

                        <div className="relative mb-4 flex justify-center">
                          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-amber-500/20 rounded-full blur-2xl"></div>
                          <div
                            className="relative w-24 h-24 z-10"
                            style={{
                              backgroundImage: `url(${listing.pokemon.pokemonId.sprite || '/characters/noChar.png'})`,
                              backgroundPosition: '-5px 0px',
                              backgroundSize: '700px 700px',
                              backgroundRepeat: 'no-repeat',
                              imageRendering: 'pixelated',
                            }}
                          />
                        </div>

                        <h3 className="text-lg font-bold text-white mb-1 text-center">{listing.pokemon.pokemonId.name}</h3>
                        <p className="text-sm text-yellow-300 text-center mb-3">Level {listing.pokemon.level}</p>
                        <div className="flex items-center justify-center gap-2 text-amber-400 font-bold mb-4">
                          <Coins className="w-4 h-4" />
                          {listing.price.toFixed(2)} ETH
                        </div>

                        <button
                          onClick={() => handleCancelListing(listing._id)}
                          className="w-full py-2 px-3 bg-rose-500 text-white font-semibold rounded-lg hover:bg-rose-600 transition-all text-sm"
                        >
                          Cancel Listing
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {userOwnedPokemon.length > 0 ? (
                    userOwnedPokemon.map((p) => {
                      const isListed = myListings.some(l => String(l.pokemon.pokemonId._id) === String(p._id));
                      return (
                        <div
                          key={p._id || p.id}
                          className="group relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-3xl p-6 border-2 border-blue-400/30 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:border-blue-400/60"
                        >
                          {isListed && (
                            <div className="absolute top-3 right-3 px-3 py-1 bg-yellow-500 rounded-full text-black text-xs font-bold">
                              On Sale
                            </div>
                          )}

                          {/* Pokémon Sprite */}
                          <div className="relative mb-6 flex justify-center">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-500/20 rounded-full blur-2xl group-hover:blur-3xl transition-all duration-500"></div>
                            <div
                              className="relative w-32 h-32 z-10 animate-float"
                              style={{
                                backgroundImage: `url(${p.sprite || '/characters/noChar.png'})`,
                                backgroundPosition: '-5px 0px',
                                backgroundSize: '700px 700px',
                                backgroundRepeat: 'no-repeat',
                                imageRendering: 'pixelated',
                              }}
                            />
                          </div>

                          {/* Pokémon Info */}
                          <div className="text-center mb-6">
                            <h3 className="text-xl font-bold text-white mb-2">{p.name}</h3>
                            <div className="flex flex-col items-center gap-2 mb-2">
                              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-400/20 border border-blue-400/30 rounded-full">
                                <span className="text-sm font-semibold text-blue-400 capitalize">{p.type}</span>
                              </div>
                              <div className="text-lg text-amber-400 font-bold">Level {p.userLevel || 1}</div>
                            </div>
                          </div>

                          {/* Stats */}
                          {p.baseStats && (
                            <div className="space-y-2 mb-6">
                              {Object.entries(statIcons).map(([key]) => (
                                <StatRow
                                  key={key}
                                  label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                  value={p.baseStats[key] ?? "-"}
                                />
                              ))}
                            </div>
                          )}

                          {/* Actions */}
                          <div className="space-y-2">
                            <button
                              onClick={() => {
                                setSelectedPokemonToSell(p);
                                setShowSellModal(true);
                              }}
                              disabled={isListed}
                              className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                              <TrendingUp className="w-4 h-4" />
                              {isListed ? 'Already Listed' : 'Sell'}
                            </button>

                            <button
                              onClick={() => {
                                setSelectedPokemonToUpgrade(p);
                                setShowUpgradeModal(true);
                              }}
                              disabled={p.userLevel >= 50}
                              className="w-full py-2 px-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold rounded-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                            >
                              <Plus className="w-3 h-3" />
                              {p.userLevel >= 50 ? 'Max Level' : `Upgrade (${(0.1).toFixed(2)} ETH)`}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-full flex flex-col items-center justify-center min-h-[400px] text-center">
                      <div className="w-32 h-32 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                        <Star className="w-16 h-16 text-gray-400" />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-4">Empty Collection</h3>
                      <p className="text-gray-400 max-w-md">
                        You don't have any Pokémon yet. Visit the buy section to start building your team!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Marketplace Listings Tab */}
            {activeTab === 'marketplace' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {listings.length > 0 ? (
                  listings.map((listing) => (
                      <div
                        key={listing._id}
                        className="group relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-3xl p-6 border-2 border-pink-400/30 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:border-pink-400/60"
                      >
                        {/* Seller Info */}
                        <div className="absolute top-3 left-3 px-3 py-1 bg-white/10 rounded-full text-gray-300 text-xs font-semibold">
                          {listing.sellerId.name}
                        </div>

                        {/* Pokémon Sprite */}
                        <div className="relative mb-6 flex justify-center">
                          <div className="absolute inset-0 bg-gradient-to-br from-pink-400/20 to-rose-500/20 rounded-full blur-2xl group-hover:blur-3xl transition-all duration-500"></div>
                          <div
                            className="relative w-32 h-32 z-10 animate-float"
                            style={{
                              backgroundImage: `url(${listing.pokemon.pokemonId.sprite || '/characters/noChar.png'})`,
                              backgroundPosition: '-5px 0px',
                              backgroundSize: '700px 700px',
                              backgroundRepeat: 'no-repeat',
                              imageRendering: 'pixelated',
                            }}
                          />
                        </div>

                        {/* Pokémon Info */}
                        <div className="text-center mb-6">
                          <h3 className="text-xl font-bold text-white mb-2">{listing.pokemon.pokemonId.name}</h3>
                          <div className="flex flex-col items-center gap-2 mb-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-pink-400/20 border border-pink-400/30 rounded-full">
                              <span className="text-sm font-semibold text-pink-400 capitalize">{listing.pokemon.pokemonId.type}</span>
                            </div>
                            <div className="text-lg text-amber-400 font-bold">Level {listing.pokemon.level}</div>
                          </div>
                        </div>

                        {/* Stats */}
                        {listing.pokemon.pokemonId.baseStats && (
                          <div className="space-y-2 mb-6">
                            {Object.entries(statIcons).map(([key]) => (
                              <StatRow
                                key={key}
                                label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                value={listing.pokemon.pokemonId.baseStats[key] ?? "-"}
                              />
                            ))}
                          </div>
                        )}

                        {/* Price & Action */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-center gap-2 text-rose-400 font-bold text-lg">
                            <Coins className="w-5 h-5" />
                            {listing.price.toFixed(2)} ETH
                          </div>

                          <button
                            onClick={() => handleBuyFromListing(listing._id)}
                            disabled={!!purchasingId || !user}
                            className="group w-full py-3 px-4 bg-gradient-to-r from-pink-500 to-rose-600 text-white font-bold rounded-xl hover:scale-105 shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
                          >
                            <ShoppingCart className={`w-4 h-4 ${purchasingId === listing._id ? 'animate-spin' : 'group-hover:scale-110 transition-transform'}`} />
                            {purchasingId === listing._id ? 'Buying...' : 'Buy'}
                            <div className="absolute inset-0 rounded-xl border-2 border-white/20 group-hover:border-white/40 transition-colors duration-300"></div>
                          </button>

                          {!user && (
                            <p className="text-rose-400 text-sm text-center">Login required</p>
                          )}
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="col-span-full flex flex-col items-center justify-center min-h-[400px] text-center">
                    <div className="w-32 h-32 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                      <Coins className="w-16 h-16 text-gray-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4">No Listings</h3>
                    <p className="text-gray-400 max-w-md">
                      No Pokémon are currently listed for sale. Check back later!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sell Modal */}
      {showSellModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 p-8 max-w-md w-full border-4 border-blue-500">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'monospace' }}>LIST FOR SALE</h2>
              <button
                onClick={() => {
                  setShowSellModal(false);
                  setSelectedPokemonToSell(null);
                  setSellPrice('');
                }}
                className="p-2 hover:bg-red-600 border-2 border-red-500 transition-all"
              >
                <X className="w-6 h-6 text-white" strokeWidth={3} />
              </button>
            </div>

            {selectedPokemonToSell && (
              <div className="bg-black border-2 border-gray-700 p-6 mb-6">
                <div className="flex items-center gap-4">
                  <div
                    className="w-20 h-20 border-2 border-yellow-400"
                    style={{
                      backgroundImage: `url(${selectedPokemonToSell.sprite || '/characters/noChar.png'})`,
                      backgroundPosition: '-5px 0px',
                      backgroundSize: '700px 700px',
                      backgroundRepeat: 'no-repeat',
                      imageRendering: 'pixelated',
                    }}
                  />
                  <div>
                    <h3 className="text-lg font-bold text-yellow-400" style={{ fontFamily: 'monospace' }}>{selectedPokemonToSell.name.toUpperCase()}</h3>
                    <p className="text-sm text-green-400 font-bold" style={{ fontFamily: 'monospace' }}>LEVEL {selectedPokemonToSell.userLevel || 1}</p>
                    <p className="text-sm text-white capitalize font-bold" style={{ fontFamily: 'monospace' }}>{selectedPokemonToSell.type.toUpperCase()}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-yellow-400 font-bold mb-2" style={{ fontFamily: 'monospace' }}>PRICE (ETH)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={sellPrice}
                onChange={(e) => setSellPrice(e.target.value)}
                placeholder="0.01"
                className="w-full px-4 py-3 bg-black border-2 border-yellow-400 text-yellow-400 placeholder-gray-600 focus:outline-none focus:border-green-400 font-bold"
                style={{ fontFamily: 'monospace' }}
              />
              <p className="text-xs text-gray-400 mt-2 font-bold" style={{ fontFamily: 'monospace' }}>MIN: 0.01 ETH</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSellModal(false);
                  setSelectedPokemonToSell(null);
                  setSellPrice('');
                }}
                className="flex-1 py-3 px-4 bg-gray-900 border-2 border-gray-700 text-white font-bold hover:border-red-400 transition-all"
                style={{ fontFamily: 'monospace' }}
              >
                CANCEL
              </button>
              <button
                onClick={handleListForSale}
                disabled={selling || !sellPrice}
                className="flex-1 py-3 px-4 bg-blue-500 text-white font-bold hover:bg-blue-400 border-2 border-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ fontFamily: 'monospace', boxShadow: '0 4px 0 #1e40af' }}
              >
                {selling ? 'LISTING...' : 'LIST FOR SALE'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 p-8 max-w-md w-full border-4 border-amber-500">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'monospace' }}>UPGRADE LEVEL</h2>
              <button
                onClick={() => {
                  setShowUpgradeModal(false);
                  setSelectedPokemonToUpgrade(null);
                }}
                className="p-2 hover:bg-red-600 border-2 border-red-500 transition-all"
              >
                <X className="w-6 h-6 text-white" strokeWidth={3} />
              </button>
            </div>

            {selectedPokemonToUpgrade && (
              <div className="bg-black border-2 border-gray-700 p-6 mb-6">
                <div className="flex items-center gap-4">
                  <div
                    className="w-20 h-20 border-2 border-amber-400"
                    style={{
                      backgroundImage: `url(${selectedPokemonToUpgrade.sprite || '/characters/noChar.png'})`,
                      backgroundPosition: '-5px 0px',
                      backgroundSize: '700px 700px',
                      backgroundRepeat: 'no-repeat',
                      imageRendering: 'pixelated',
                    }}
                  />
                  <div>
                    <h3 className="text-lg font-bold text-yellow-400" style={{ fontFamily: 'monospace' }}>{selectedPokemonToUpgrade.name.toUpperCase()}</h3>
                    <p className="text-sm text-green-400 font-bold" style={{ fontFamily: 'monospace' }}>
                      LEVEL {selectedPokemonToUpgrade.userLevel || 1} → {(selectedPokemonToUpgrade.userLevel || 1) + 1}
                    </p>
                    <p className="text-sm text-amber-400 font-bold mt-2" style={{ fontFamily: 'monospace' }}>COST: 0.10 ETH</p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-black border-2 border-yellow-400 p-4 mb-6">
              <p className="text-sm text-yellow-400 font-bold" style={{ fontFamily: 'monospace' }}>
                <span>BALANCE:</span> {user?.balance?.toFixed(2) || '0'} ETH
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowUpgradeModal(false);
                  setSelectedPokemonToUpgrade(null);
                }}
                className="flex-1 py-3 px-4 bg-gray-900 border-2 border-gray-700 text-white font-bold hover:border-red-400 transition-all"
                style={{ fontFamily: 'monospace' }}
              >
                CANCEL
              </button>
              <button
                onClick={handleUpgradeLevel}
                disabled={upgrading || (user?.balance || 0) < 0.1}
                className="flex-1 py-3 px-4 bg-amber-500 text-white font-bold hover:bg-amber-400 border-2 border-amber-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ fontFamily: 'monospace', boxShadow: '0 4px 0 #92400e' }}
              >
                {upgrading ? 'UPGRADING...' : 'UPGRADE'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketPlace;