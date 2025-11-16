// MarketPlace.jsx
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import Web3Context from '../context/Web3Context';
import { ArrowLeft, ShoppingCart, Star, Coins, Zap, TrendingUp, TrendingDown, Target, Heart, Gauge, X, Plus, Network } from 'lucide-react';
import axios from 'axios';
import { ethers } from 'ethers';
import crossChainService from '../services/crossChainService';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

const formatPrice = (value, fallback = '0.50') => {
  if (value === null || value === undefined) return fallback;
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return fallback;
  const str = numeric.toString();
  if (!str.includes('.')) return str;
  const trimmed = str.replace(/0+$/, '').replace(/\.$/, '');
  return trimmed.length ? trimmed : '0';
};

const MarketPlace = () => {
  const { user, token, refreshUser } = useContext(AuthContext);
  const { signer, isConnected } = useContext(Web3Context);
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
  const [crossChainListings, setCrossChainListings] = useState([]);
  const [showCrossChain, setShowCrossChain] = useState(false);

  const hasUserPokemon = user?.pokemon && user.pokemon.length > 0;
  const userPokemonIds = user?.pokemon?.map(p => String(p.pokemonId?._id || p.pokemonId || '')) || [];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pokemonRes, listingsRes, crossChainRes] = await Promise.all([
        axios.get(`${API_BASE}/api/pokemon`),
        axios.get(`${API_BASE}/api/pokemon/listings`),
        crossChainService.getCrossChainListings(50).catch(() => ({ listings: [] }))
      ]);
      setPokemon(pokemonRes.data.pokemon || []);
      const normalizedListings = (listingsRes.data.listings || []).map(listing => ({
        ...listing,
        price: Number(listing.price),
      }));
      setListings(normalizedListings);
      setCrossChainListings(crossChainRes.listings || []);
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
      const normalized = (res.data.listings || []).map(listing => ({
        ...listing,
        price: Number(listing.price),
      }));
      setMyListings(normalized);
    } catch (err) {
      console.error('Error fetching my listings:', err);
    }
  }, [token]);

  useEffect(() => {
    if (activeTab === 'sell' && token) {
      fetchMyListings();
    }
  }, [activeTab, token, fetchMyListings]);

  const purchase = async (id) => {
    console.log('Purchase function called with id:', id);
    
    if (!token) {
      console.log('No token, redirecting to login');
      setError('Please login to add Pokémon to your team');
      navigate('/login');
      return;
    }
    
    if (!isConnected || !signer) {
      console.log('Wallet not connected:', { isConnected, hasSigner: !!signer });
      setError('Please connect your wallet to add Pokémon to your team');
      return;
    }

    setPurchasingId(id);
    setError(null);
    setSuccess(null);
    
    try {
      // Find the pokemon data
      const pokemonData = pokemon.find(p => String(p._id) === String(id));
      if (!pokemonData) {
        console.error('Pokémon not found:', id);
        setError('Pokémon not found');
        setPurchasingId(null);
        return;
      }

      // Check if user already has this pokemon
      if (userPokemonIds.includes(String(id))) {
        console.log('User already has this Pokémon');
        setError('You already have this Pokémon');
        setPurchasingId(null);
        return;
      }

      // Get payment address from backend
      console.log('Initiating purchase with backend...');
      setSuccess('Initiating purchase...');
      
      const initiateResponse = await axios.post(
        `${API_BASE}/api/pokemon/initiate-purchase`,
        { pokemonId: id },
        { headers: { Authorization: `Bearer ${token}` }}
      );

      console.log('Initiate purchase response:', initiateResponse.data);
      const { paymentAddress, paymentAmount } = initiateResponse.data;

      if (!paymentAddress || !paymentAmount) {
        throw new Error('Invalid response from server: missing payment details');
      }

      // Step 1: User sends payment transaction
      console.log('Sending transaction:', { to: paymentAddress, amount: paymentAmount });
      setSuccess(`Sending ${paymentAmount} GLMR... Please confirm in your wallet.`);
      
      const tx = await signer.sendTransaction({
        to: paymentAddress,
        value: ethers.parseEther(paymentAmount.toString()),
      });

      console.log('Transaction sent:', tx.hash);
      setSuccess('Payment transaction sent! Waiting for confirmation...');
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);

      if (receipt.status !== 1) {
        throw new Error('Payment transaction failed');
      }

      setSuccess('Payment confirmed! Minting NFT and adding to your team...');

      // Step 2: Call backend to complete the purchase (mint NFT and add to collection)
      console.log('Completing purchase with backend...');
      await axios.post(
        `${API_BASE}/api/pokemon/claim`,
        { 
          pokemonId: id,
          paymentTxHash: receipt.hash,
          paymentAmount: paymentAmount
        },
        { headers: { Authorization: `Bearer ${token}` }}
      );

      console.log('Purchase completed successfully');
      await refreshUser();
      setSuccess('Pokémon added to your team successfully!');
      setTimeout(() => setSuccess(null), 5000);
      setError(null);
      // Refresh listings
      fetchData();
    } catch (err) {
      console.error('Purchase error:', err);
      console.error('Error details:', {
        message: err.message,
        code: err.code,
        response: err.response?.data,
        stack: err.stack
      });
      
      if (err.code === 'ACTION_REJECTED' || err.code === 4001) {
        setError('Transaction was rejected. Please try again.');
      } else if (err.message?.includes('insufficient funds') || err.message?.includes('insufficient balance')) {
        setError('Insufficient funds for transaction');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Failed to add Pokémon to team. Please check console for details.');
      }
      setSuccess(null);
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

    if (!isConnected || !signer) {
      setError('Please connect your wallet to upgrade Pokémon');
      return;
    }

    setUpgrading(true);
    setError(null);
    
    try {
      // Step 1: Get payment details from backend
      setSuccess('Initiating upgrade...');
      const initiateResponse = await axios.post(
        `${API_BASE}/api/pokemon/initiate-upgrade`,
        { pokemonId: selectedPokemonToUpgrade._id },
        { headers: { Authorization: `Bearer ${token}` }}
      );

      const { paymentAddress, paymentAmount, currentLevel, newLevel } = initiateResponse.data;

      // Step 2: User sends payment transaction
      setSuccess(`Sending ${paymentAmount} GLMR for upgrade... Please confirm in your wallet.`);
      
      const tx = await signer.sendTransaction({
        to: paymentAddress,
        value: ethers.parseEther(paymentAmount.toString()),
      });

      setSuccess('Payment transaction sent! Waiting for confirmation...');
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();

      if (receipt.status !== 1) {
        throw new Error('Payment transaction failed');
      }

      setSuccess('Payment confirmed! Upgrading Pokémon...');

      // Step 3: Call backend to complete the upgrade
      const response = await axios.post(
        `${API_BASE}/api/pokemon/upgrade-level`,
        { 
          pokemonId: selectedPokemonToUpgrade._id,
          paymentTxHash: receipt.hash,
          paymentAmount: paymentAmount
        },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      const { statIncrease } = response.data;
      if (statIncrease) {
        const { oldStats, newStats } = statIncrease;
        const statChanges = [];
        if (oldStats.shootRange !== newStats.shootRange) {
          statChanges.push(`Range: ${oldStats.shootRange} → ${newStats.shootRange}`);
        }
        if (oldStats.shootPerMin !== newStats.shootPerMin) {
          statChanges.push(`Shots/min: ${oldStats.shootPerMin} → ${newStats.shootPerMin}`);
        }
        if (oldStats.hitPoints !== newStats.hitPoints) {
          statChanges.push(`HP: ${oldStats.hitPoints} → ${newStats.hitPoints}`);
        }
        if (oldStats.speed !== newStats.speed) {
          statChanges.push(`Speed: ${oldStats.speed} → ${newStats.speed}`);
        }
        setSuccess(`Level ${currentLevel} → ${newLevel}! Stats increased: ${statChanges.join(', ')}`);
      } else {
        setSuccess(`Level upgraded from ${currentLevel} to ${newLevel}!`);
      }
      setTimeout(() => setSuccess(null), 5000);
      await refreshUser();
      setShowUpgradeModal(false);
      setSelectedPokemonToUpgrade(null);
      setError(null);
    } catch (err) {
      console.error('Upgrade error:', err);
      if (err.code === 'ACTION_REJECTED' || err.code === 4001) {
        setError('Transaction was rejected. Please try again.');
      } else if (err.message?.includes('insufficient funds') || err.message?.includes('insufficient balance')) {
        setError('Insufficient funds for transaction');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError(err?.message || 'Failed to upgrade level');
      }
      setSuccess(null);
    } finally {
      setUpgrading(false);
    }
  };

  const handleBuyFromListing = async (listing) => {
    const listingId = listing?._id;
    if (!listingId) return;
    if (!token) return navigate('/login');

    if (!isConnected || !signer) {
      setError('Please connect your wallet to purchase from listings');
      return;
    }

    const buyerId = user?.id || user?._id;
    if (buyerId && String(listing.sellerId?._id || listing.sellerId) === String(buyerId)) {
      setError('You cannot purchase your own listing');
      return;
    }

    const sellerWallet = listing.sellerId?.walletAddress;
    if (!sellerWallet) {
      setError('Seller wallet address unavailable for this listing');
      return;
    }

    const priceValue = Number(listing.price);
    if (Number.isNaN(priceValue) || priceValue <= 0) {
      setError('Invalid listing price');
      return;
    }

    setPurchasingId(listingId);
    setError(null);

    try {
      const priceDisplay = formatPrice(priceValue);
      setSuccess(`Sending ${priceDisplay} GLMR to seller... Please confirm in your wallet.`);
      const tx = await signer.sendTransaction({
        to: sellerWallet,
        value: ethers.parseEther(priceValue.toString()),
      });

      setSuccess('Payment submitted. Waiting for confirmation...');
      const receipt = await tx.wait();

      if (receipt.status !== 1) {
        throw new Error('Payment transaction failed');
      }

      setSuccess('Payment confirmed. Finalizing purchase...');
      await axios.post(
        `${API_BASE}/api/pokemon/buy-from-listing`,
        { listingId, paymentTxHash: receipt.hash, paymentAmount: priceValue },
        { headers: { Authorization: `Bearer ${token}` }}
      );

      setSuccess(`Pokémon purchased for ${formatPrice(priceValue)} GLMR!`);
      setTimeout(() => setSuccess(null), 3000);
      await refreshUser();
      await fetchData();
      setError(null);
    } catch (err) {
      console.error('Buy from listing error:', err);
      if (err.code === 'ACTION_REJECTED' || err.code === 4001) {
        setError('Transaction was rejected. Please try again.');
      } else if (err.message?.includes('insufficient funds') || err.message?.includes('insufficient balance')) {
        setError('Insufficient funds for transaction');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError(err?.message || 'Failed to purchase from listing');
      }
      setSuccess(null);
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
    if (!p.pokemonId) return uniquePokemon;
    const pokemonId = String(p.pokemonId._id || p.pokemonId);
    const existing = uniquePokemon.find(up => String(up._id) === pokemonId);
    
    if (!existing) {
      // Use user's stats if available, otherwise use base stats
      const displayStats = p.stats && Object.values(p.stats).some(v => v !== null) 
        ? p.stats 
        : p.pokemonId.baseStats;
      
      uniquePokemon.push({
        ...p.pokemonId,
        userLevel: p.level,
        userStats: displayStats,
        _id: p.pokemonId._id || p.pokemonId
      });
    } else if (p.level > existing.userLevel) {
      // If this copy has a higher level, update it
      existing.userLevel = p.level;
      const displayStats = p.stats && Object.values(p.stats).some(v => v !== null) 
        ? p.stats 
        : p.pokemonId.baseStats;
      existing.userStats = displayStats;
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
          <h1 className="text-5xl md:text-7xl font-black mb-4 leading-tight text-glow" style={{
            fontFamily: 'monospace',
            color: '#fbbf24',
            textShadow: '3px 3px 0 #dc2626, 5px 5px 0 #000, 0 0 30px rgba(251, 191, 36, 0.5)'
          }}>
            MARKETPLACE
          </h1>
          <p className="text-xl text-green-400 max-w-2xl mx-auto" style={{ fontFamily: 'monospace' }}>
            &gt; TRADE.EXE | BUY • SELL • UPGRADE
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center items-center gap-4 mb-8 flex-wrap">
          <button
            onClick={() => setActiveTab('buy')}
            className={`flex items-center justify-center gap-3 px-6 py-3 font-bold transition-all transform ${
              activeTab === 'buy'
                ? 'bg-green-500 text-black border-4 border-green-700 scale-105'
                : 'bg-gray-900 border-2 border-gray-700 text-yellow-400 hover:border-yellow-400'
            }`}
            style={{ fontFamily: 'monospace', boxShadow: activeTab === 'buy' ? '0 8px 0 #166534' : 'none' }}
          >
            <TrendingDown className="w-5 h-5 flex-shrink-0" />
            <span className="whitespace-nowrap">BUY POKEMON</span>
          </button>

          {hasUserPokemon && (
            <>
              <button
                onClick={() => setActiveTab('sell')}
                className={`flex items-center justify-center gap-3 px-6 py-3 font-bold transition-all transform ${
                  activeTab === 'sell'
                    ? 'bg-blue-500 text-white border-4 border-blue-700 scale-105'
                    : 'bg-gray-900 border-2 border-gray-700 text-yellow-400 hover:border-yellow-400'
                }`}
                style={{ fontFamily: 'monospace', boxShadow: activeTab === 'sell' ? '0 8px 0 #1e40af' : 'none' }}
              >
                <TrendingUp className="w-5 h-5 flex-shrink-0" />
                <span className="whitespace-nowrap">YOUR COLLECTION</span>
              </button>

              <button
                onClick={() => setActiveTab('marketplace')}
                className={`flex items-center justify-center gap-3 px-6 py-3 font-bold transition-all transform ${
                  activeTab === 'marketplace'
                    ? 'bg-rose-500 text-white border-4 border-rose-700 scale-105'
                    : 'bg-gray-900 border-2 border-gray-700 text-yellow-400 hover:border-yellow-400'
                }`}
                style={{ fontFamily: 'monospace', boxShadow: activeTab === 'marketplace' ? '0 8px 0 #991b1b' : 'none' }}
              >
                <Coins className="w-5 h-5 flex-shrink-0" />
                <span className="whitespace-nowrap">MARKETPLACE</span>
              </button>
            </>
          )}

          {!hasUserPokemon && (
            <div className="px-6 py-3 bg-gray-900 border-2 border-gray-700 text-gray-500 font-bold flex items-center justify-center gap-3" style={{ fontFamily: 'monospace' }}>
              <TrendingUp className="w-5 h-5 flex-shrink-0" />
              <span className="whitespace-nowrap">GET POKEMON TO SELL</span>
            </div>
          )}
        </div>

        {/* Filters */}
        {activeTab === 'buy' && (
          <div className="flex justify-center items-center gap-4 mb-8 flex-wrap">
            <div className="flex items-center gap-4 bg-gray-900 border-2 border-gray-700 px-6 py-3" style={{ fontFamily: 'monospace' }}>
              <span className="text-yellow-400 font-bold whitespace-nowrap">SORT BY:</span>
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
            <button
              onClick={() => setShowCrossChain(!showCrossChain)}
              className={`flex items-center justify-center gap-2 px-6 py-3 font-bold transition-all ${
                showCrossChain
                  ? 'bg-purple-500 text-white border-4 border-purple-700'
                  : 'bg-gray-900 border-2 border-gray-700 text-purple-400 hover:border-purple-400'
              }`}
              style={{ fontFamily: 'monospace' }}
            >
              <Network className="w-5 h-5 flex-shrink-0" />
              <span className="whitespace-nowrap">{showCrossChain ? 'HIDE' : 'SHOW'} CROSS-CHAIN</span>
            </button>
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
                  displayedPokemon.map((p, index) => (
                    <div
                      key={p._id || p.id}
                      className="bg-gray-900 rounded-lg p-6 border-2 border-emerald-400"
                    >
                      {/* Pokémon Sprite */}
                      <div className="mb-6 flex justify-center">
                        <div
                          className="w-32 h-32"
                          style={{
                            backgroundImage: `url(${p.sprite || '/characters/noChar.png'})`,
                            backgroundPosition: '-5px 0px',
                            backgroundSize: '700px 700px',
                            backgroundRepeat: 'no-repeat',
                            imageRendering: 'pixelated'
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
                          {formatPrice(p.price, '0.50')} GLMR
                        </div>

                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!user) {
                              setError('Please login to add Pokémon to your team');
                              navigate('/login');
                              return;
                            }
                            if (!isConnected || !signer) {
                              setError('Please connect your wallet to add Pokémon to your team');
                              return;
                            }
                            purchase(p._id);
                          }}
                          disabled={!!purchasingId || !user || (user && (!isConnected || !signer))}
                          className="w-full py-3 px-4 bg-emerald-500 text-white font-bold rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 cursor-pointer"
                        >
                          <ShoppingCart className={`w-4 h-4 ${purchasingId === p._id ? 'animate-spin' : ''}`} />
                          {purchasingId === p._id ? 'Purchasing...' : 'Add to Team'}
                        </button>

                        {!user && (
                          <p className="text-rose-400 text-sm text-center">Login required to purchase</p>
                        )}
                        {user && (!isConnected || !signer) && (
                          <p className="text-rose-400 text-sm text-center">Connect wallet to purchase</p>
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

            {/* Cross-Chain Listings Section */}
            {activeTab === 'buy' && showCrossChain && crossChainListings.length > 0 && (
              <div className="mt-12">
                <div className="flex items-center justify-center gap-3 mb-8">
                  <Network className="w-6 h-6 text-purple-400" />
                  <h2 className="text-2xl font-bold text-purple-400" style={{ fontFamily: 'monospace' }}>
                    CROSS-CHAIN LISTINGS
                  </h2>
                  <Network className="w-6 h-6 text-purple-400" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {crossChainListings.map((listing, idx) => (
                    <div
                      key={`${listing.chain}-${listing.listingId}-${idx}`}
                      className="bg-gray-900 rounded-lg p-6 border-2 border-purple-400"
                    >
                      <div className="mb-2 text-center">
                        <span className="px-3 py-1 bg-purple-500 rounded-full text-white text-xs font-bold">
                          {listing.chain.toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="text-center mb-4">
                        <h3 className="text-lg font-bold text-white mb-2">Token #{listing.tokenId}</h3>
                        <div className="flex items-center justify-center gap-2 text-purple-400 font-bold text-lg">
                          <Coins className="w-5 h-5" />
                          {formatPrice(listing.price)} {listing.chain === 'moonbeam' ? 'GLMR' : 'DEV'}
                        </div>
                      </div>

                      <div className="space-y-2 mb-4 text-sm text-gray-300">
                        <div>Seller: {listing.seller.slice(0, 6)}...{listing.seller.slice(-4)}</div>
                        <div>Listed: {new Date(listing.createdAt).toLocaleDateString()}</div>
                      </div>

                      <button
                        onClick={() => {
                          setError('Cross-chain purchase requires wallet connection to the source chain. Feature coming soon!');
                        }}
                        className="w-full py-3 px-4 bg-purple-500 text-white font-bold rounded-lg hover:bg-purple-600 transition-colors flex items-center justify-center gap-3 cursor-pointer"
                      >
                        <Network className="w-4 h-4" />
                        Purchase from {listing.chain}
                      </button>
                    </div>
                  ))}
                </div>
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
                    {myListings.map((listing) => {
                      if (!listing.pokemon?.pokemonId) return null;
                      return (
                      <div
                        key={listing._id}
                        className="bg-gray-900 rounded-lg p-6 border-2 border-yellow-400"
                      >
                        <div className="mb-4 flex justify-center">
                          <div
                            className="w-24 h-24"
                            style={{
                              backgroundImage: `url(${listing.pokemon.pokemonId?.sprite || '/characters/noChar.png'})`,
                              backgroundPosition: '-5px 0px',
                              backgroundSize: '700px 700px',
                              backgroundRepeat: 'no-repeat',
                              imageRendering: 'pixelated',
                            }}
                          />
                        </div>

                        <h3 className="text-lg font-bold text-white mb-1 text-center">{listing.pokemon.pokemonId?.name || 'Unknown'}</h3>
                        <p className="text-sm text-yellow-300 text-center mb-3">Level {listing.pokemon.level}</p>
                        <div className="flex items-center justify-center gap-2 text-amber-400 font-bold mb-4">
                          <Coins className="w-4 h-4" />
                          {formatPrice(listing.price)} GLMR
                        </div>

                        <button
                          onClick={() => handleCancelListing(listing._id)}
                          className="w-full py-2 px-3 bg-rose-500 text-white font-semibold rounded-lg hover:bg-rose-600 transition-colors text-sm cursor-pointer"
                        >
                          Cancel Listing
                        </button>
                      </div>
                      );
                    })}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {userOwnedPokemon.length > 0 ? (
                    userOwnedPokemon.map((p) => {
                      const isListed = myListings.some(l => String(l.pokemon?.pokemonId?._id || l.pokemon?.pokemonId) === String(p._id));
                      return (
                        <div
                          key={p._id || p.id}
                          className="bg-gray-900 rounded-lg p-6 border-2 border-blue-400"
                        >
                          {isListed && (
                            <div className="mb-2 text-center">
                              <span className="px-3 py-1 bg-yellow-500 rounded-full text-black text-xs font-bold">
                                On Sale
                              </span>
                            </div>
                          )}

                          {/* Pokémon Sprite */}
                          <div className="mb-6 flex justify-center">
                            <div
                              className="w-32 h-32"
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
                          {(p.userStats || p.baseStats) && (
                            <div className="space-y-2 mb-6">
                              {Object.entries(statIcons).map(([key]) => {
                                const stats = p.userStats || p.baseStats;
                                return (
                                  <StatRow
                                    key={key}
                                    label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                    value={stats[key] ?? "-"}
                                  />
                                );
                              })}
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
                              className="w-full py-3 px-4 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
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
                              className="w-full py-2 px-4 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              {p.userLevel >= 50 ? 'Max Level' : `Upgrade (${(0.1).toFixed(2)} GLMR)`}
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
                  listings.map((listing) => {
                    if (!listing.pokemon?.pokemonId) return null;
                    return (
                      <div
                        key={listing._id}
                        className="bg-gray-900 rounded-lg p-6 border-2 border-pink-400"
                      >
                        {/* Seller Info */}
                        <div className="mb-2 text-center">
                          <span className="px-3 py-1 bg-gray-800 rounded-full text-gray-300 text-xs font-semibold">
                            {listing.sellerId?.name || 'Unknown'}
                          </span>
                        </div>

                        {/* Pokémon Sprite */}
                        <div className="mb-6 flex justify-center">
                          <div
                            className="w-32 h-32"
                            style={{
                              backgroundImage: `url(${listing.pokemon.pokemonId?.sprite || '/characters/noChar.png'})`,
                              backgroundPosition: '-5px 0px',
                              backgroundSize: '700px 700px',
                              backgroundRepeat: 'no-repeat',
                              imageRendering: 'pixelated',
                            }}
                          />
                        </div>

                        {/* Pokémon Info */}
                        <div className="text-center mb-6">
                          <h3 className="text-xl font-bold text-white mb-2">{listing.pokemon.pokemonId?.name || 'Unknown'}</h3>
                          <div className="flex flex-col items-center gap-2 mb-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-pink-400/20 border border-pink-400/30 rounded-full">
                              <span className="text-sm font-semibold text-pink-400 capitalize">{listing.pokemon.pokemonId?.type || 'Unknown'}</span>
                            </div>
                            <div className="text-lg text-amber-400 font-bold">Level {listing.pokemon.level}</div>
                          </div>
                        </div>

                        {/* Stats */}
                        {listing.pokemon.pokemonId?.baseStats && (
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
                            {formatPrice(listing.price)} GLMR
                          </div>

                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleBuyFromListing(listing);
                            }}
                            disabled={!!purchasingId || !user}
                            className="w-full py-3 px-4 bg-pink-500 text-white font-bold rounded-lg hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 cursor-pointer"
                          >
                            <ShoppingCart className={`w-4 h-4 ${purchasingId === listing._id ? 'animate-spin' : ''}`} />
                            {purchasingId === listing._id ? 'Buying...' : 'Buy'}
                          </button>

                          {!user && (
                            <p className="text-rose-400 text-sm text-center">Login required</p>
                          )}
                        </div>
                      </div>
                    );
                  })
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
              <label className="block text-yellow-400 font-bold mb-2" style={{ fontFamily: 'monospace' }}>PRICE (GLMR)</label>
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
              <p className="text-xs text-gray-400 mt-2 font-bold" style={{ fontFamily: 'monospace' }}>MIN: 0.01 GLMR</p>
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
                    <p className="text-sm text-amber-400 font-bold mt-2" style={{ fontFamily: 'monospace' }}>COST: 0.10 GLMR</p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-black border-2 border-yellow-400 p-4 mb-6">
              <p className="text-sm text-yellow-400 font-bold mb-2" style={{ fontFamily: 'monospace' }}>
                <span>COST:</span> 0.10 GLMR (On-Chain Payment)
              </p>
              {!isConnected && (
                <p className="text-xs text-red-400 font-bold" style={{ fontFamily: 'monospace' }}>
                  ⚠ Connect your wallet to upgrade
                </p>
              )}
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
                disabled={upgrading || !isConnected}
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