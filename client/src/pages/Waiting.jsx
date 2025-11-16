// Waiting.jsx
import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import AuthContext from '../context/AuthContext';
import Web3Context from '../context/Web3Context';
import PlayersList from '../components/Waiting/PlayerList.jsx';
import ChatBox from '../components/Waiting/ChatBox.jsx';
import GameSettings from '../components/Waiting/GameSettings.jsx';
import { Copy, Check, Users, MessageCircle, Settings, Play, Coins, Loader } from 'lucide-react';
import { createMatch, joinMatch } from '../services/matchEscrow.js';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';
let socket;

const Waiting = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const { user, selectedPokemon } = useContext(AuthContext);
  const { signer, address, isConnected } = useContext(Web3Context);
  
  // Use GLMR as the currency unit everywhere
  const currencySymbol = 'GLMR';

  const [lobby, setLobby] = useState(null);
  const [joined, setJoined] = useState(false);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState('');
  const [gameSettings, setGameSettings] = useState({
    gameTime: '',
    map: '',
    gameType: '',
    stake: '',
  });

  const [copied, setCopied] = useState(false);
  const [stakingInfo, setStakingInfo] = useState(null);
  const [stakingStatus, setStakingStatus] = useState(null); // 'idle', 'creating', 'joining', 'success'
  const [stakingProgress, setStakingProgress] = useState(null);
  const isOwner = lobby?.ownerId === user?.id;

  useEffect(() => {
    if (!socket) {
      socket = io(API_BASE, { transports: ['websocket', 'polling'] });
    }

    socket.on('connect', () => console.log('✅ Connected:', socket.id));
    socket.on('disconnect', (reason) => console.log('🔌 Disconnected:', reason));
    socket.on('lobbyData', (data) => {
      setLobby(data);
      setGameSettings(data.gameSettings || {});
    });
    socket.on('lobbyUpdate', (data) => {
      setLobby(data);
      setGameSettings(data.gameSettings || {});
    });
    socket.on('message', (msg) => setMessages((prev) => [...prev, msg]));
    socket.on('lobbyError', (msg) => setError(msg));
    socket.on('gameStarting', () => navigate(`/battle/game/${code}`));
    
    // Staking events
    socket.on('stakeRequired', (data) => {
      console.log('💰 Staking required:', data);
      setStakingInfo(data);
      setStakingStatus('idle');
      setStakingProgress({
        playersStaked: 0,
        totalPlayers: data.totalPlayers,
        totalStake: 0
      });
    });

    socket.on('stakingProgress', (data) => {
      console.log('📊 Staking progress:', data);
      setStakingProgress(data);
      if (data.playersStaked === data.totalPlayers) {
        setStakingStatus('success');
      }
    });

    return () => {
      socket.off('lobbyData');
      socket.off('lobbyUpdate');
      socket.off('message');
      socket.off('lobbyError');
      socket.off('gameStarting');
      socket.off('stakeRequired');
      socket.off('stakingProgress');
    };
  }, [code, navigate]);

  useEffect(() => {
    if (!joined && user?.id && user?.name) {
      socket.emit('joinLobby', {
        code,
        playerName: user.name,
        playerId: user.id,
        selectedPokemonDetails: selectedPokemon || null,
      });
      setJoined(true);
    }
  }, [joined, user, code, selectedPokemon]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle stake creation (Player A)
  const handleCreateStake = async () => {
    if (!signer || !address) {
      setError('Please connect your wallet first');
      return;
    }

    if (!stakingInfo) {
      setError('No staking information available');
      return;
    }

    // Check if we're Player A (by ID or wallet address)
    const userIsPlayerA = user?.id && (
      String(user.id) === String(stakingInfo.playerAId) ||
      (address && address.toLowerCase() === stakingInfo.playerA?.toLowerCase())
    );

    if (!userIsPlayerA) {
      setError('Only Player A can create the match');
      return;
    }

    if (stakingInfo.step !== 'create') {
      setError('Invalid step: Can only create in create step');
      return;
    }

    if (!stakingInfo.stakeAmount || stakingInfo.stakeAmount === null || stakingInfo.stakeAmount === undefined) {
      setError('Invalid stake amount');
      return;
    }

    if (!stakingInfo.playerB) {
      setError('Missing Player B address');
      return;
    }

    // Use wallet addresses from database (consistent with backend)
    const dbPlayerAAddress = stakingInfo.playerA; // From database
    const dbPlayerBAddress = stakingInfo.playerB; // From database

    // Verify current wallet matches database address
    if (address.toLowerCase() !== dbPlayerAAddress.toLowerCase()) {
      setError(`Wallet mismatch! Please connect wallet: ${dbPlayerAAddress}`);
      return;
    }

    setStakingStatus('creating');
    setError('');

    try {
      console.log('🎮 Player A creating match:', {
        gameCode: code,
        playerA: dbPlayerAAddress, // Using database wallet
        playerB: dbPlayerBAddress, // Using database wallet
        stakeAmount: stakingInfo.stakeAmount,
        currentAddress: address,
        note: 'Using wallet addresses from database'
      });

      const result = await createMatch(
        signer,
        code,
        dbPlayerAAddress, // Use database wallet address
        dbPlayerBAddress, // Use database wallet address
        stakingInfo.stakeAmount
      );

      console.log('✅ Match created on blockchain:', result.txHash);

      // Notify server
      socket.emit('playerStake', {
        code,
        playerId: user.id,
        stakeAmount: stakingInfo.stakeAmount,
        transactionHash: result.txHash
      });

      setStakingStatus('success');
    } catch (err) {
      console.error('❌ Failed to create match:', err);
      setError(err.message || 'Failed to create match on blockchain');
      setStakingStatus('idle');
    }
  };

  // Handle stake joining (Player B)
  const handleJoinStake = async () => {
    if (!signer || !address) {
      setError('Please connect your wallet first');
      return;
    }

    if (!stakingInfo) {
      setError('No staking information available');
      return;
    }

    // Check if we're Player B (by ID or wallet address)
    const userIsPlayerB = user?.id && (
      String(user.id) === String(stakingInfo.playerBId) ||
      (address && address.toLowerCase() === stakingInfo.playerB?.toLowerCase())
    );

    if (!userIsPlayerB) {
      setError('Only Player B can join the match');
      return;
    }

    if (stakingInfo.step !== 'join') {
      setError('Invalid step: Can only join in join step');
      return;
    }

    if (!stakingInfo.stakeAmount || stakingInfo.stakeAmount === null || stakingInfo.stakeAmount === undefined) {
      setError('Invalid stake amount');
      return;
    }

    // For joinMatch, the contract verifies msg.sender == matchData.playerB
    // The match was created with playerB from database, so current wallet MUST match
    // If it doesn't match, we need to warn the user
    if (address.toLowerCase() !== stakingInfo.playerB.toLowerCase()) {
      setError(
        `Wallet mismatch! Expected ${stakingInfo.playerB}, but your connected wallet is ${address}. ` +
        `Please either connect the correct wallet or update your wallet in the profile settings.`
      );
      return;
    }
    
    setStakingStatus('joining');
    setError('');

    try {
      console.log('🎮 Player B joining match:', {
        gameCode: code,
        playerB: address, // Using current wallet (should match stored)
        stakeAmount: stakingInfo.stakeAmount,
        note: 'Contract will verify msg.sender matches stored playerB'
      });

      const result = await joinMatch(
        signer,
        code,
        stakingInfo.stakeAmount
      );

      console.log('✅ Match joined on blockchain:', result.txHash);

      // Notify server
      socket.emit('playerStake', {
        code,
        playerId: user.id,
        stakeAmount: stakingInfo.stakeAmount,
        transactionHash: result.txHash
      });

      setStakingStatus('success');
    } catch (err) {
      console.error('❌ Failed to join match:', err);
      setError(err.message || 'Failed to join match on blockchain');
      setStakingStatus('idle');
    }
  };

  // Determine if current user is Player A or B (primary check by player ID, fallback to wallet address)
  const isPlayerA = stakingInfo && user?.id && (
    String(user.id) === String(stakingInfo.playerAId) ||
    (address && address.toLowerCase() === stakingInfo.playerA?.toLowerCase())
  );
  const isPlayerB = stakingInfo && user?.id && (
    String(user.id) === String(stakingInfo.playerBId) ||
    (address && address.toLowerCase() === stakingInfo.playerB?.toLowerCase())
  );
  const hasStaked = stakingProgress && stakingProgress.stakedPlayer && 
    (stakingProgress.stakedPlayer === user?.name || stakingStatus === 'success');
  
  // Debug logging
  if (stakingInfo && user?.id) {
    console.log('🔍 Player Detection:', {
      userId: user.id,
      playerAId: stakingInfo.playerAId,
      playerBId: stakingInfo.playerBId,
      isPlayerA,
      isPlayerB,
      step: stakingInfo.step,
      address: address?.toLowerCase(),
      playerAAddress: stakingInfo.playerA?.toLowerCase(),
      playerBAddress: stakingInfo.playerB?.toLowerCase()
    });
  }

  if (!lobby) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black" style={{
        backgroundImage: `linear-gradient(#0a0a0a 1px, transparent 1px),
                          linear-gradient(90deg, #0a0a0a 1px, transparent 1px)`,
        backgroundSize: '32px 32px',
        backgroundColor: '#000'
      }}>
        <div className="text-center">
          <div className="w-20 h-20 bg-yellow-400 mx-auto mb-6 animate-pulse" style={{
            clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)'
          }}></div>
          <p className="text-2xl font-black text-yellow-400 uppercase" style={{ fontFamily: 'monospace' }}>LOADING...</p>
          <p className="text-gray-400 mt-2 font-black uppercase" style={{ fontFamily: 'monospace' }}>CODE: {code}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-6" style={{
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
        <div className="absolute top-40 right-20 w-16 h-16 bg-blue-400" style={{
          clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
          filter: 'blur(20px)'
        }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-black mb-2" style={{
              fontFamily: 'monospace',
              color: '#fbbf24',
              textShadow: '2px 2px 0 #dc2626'
            }}>
              BATTLE <span className="text-red-500">LOBBY</span>
            </h1>
            <p className="text-yellow-400 font-black uppercase" style={{ fontFamily: 'monospace' }}>&gt; PREPARE_FOR_BATTLE.EXE</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Lobby Code */}
            <div className="flex items-center gap-3 bg-gray-900 border-4 border-yellow-400 px-4 py-3" style={{ fontFamily: 'monospace', boxShadow: '0 8px 0 #92400e' }}>
              <div className="text-right">
                <div className="text-xs text-yellow-400 font-black uppercase">LOBBY CODE</div>
                <div className="text-2xl font-black text-white tracking-widest">{code}</div>
              </div>
              <button
                onClick={handleCopyCode}
                className="p-2 bg-yellow-400 border-2 border-yellow-600 hover:bg-yellow-300 transition-all duration-300"
                title="Copy code"
                style={{ boxShadow: '0 4px 0 #d97706' }}
              >
                {copied ? <Check className="w-4 h-4 text-black" strokeWidth={3} /> : <Copy className="w-4 h-4 text-black" strokeWidth={3} />}
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Players & Chat */}
          <div className="lg:col-span-2 space-y-6">
            {/* Players List */}
            <div className="bg-gray-900 border-4 border-yellow-400 p-6" style={{ fontFamily: 'monospace', boxShadow: '0 8px 0 #92400e' }}>
              <div className="flex items-center gap-3 mb-6">
                <Users className="w-6 h-6 text-yellow-400" strokeWidth={3} />
                <h2 className="text-xl font-black text-white uppercase">Players ({lobby.players.length}/8)</h2>
              </div>
              <PlayersList
                lobby={lobby}
                isOwner={isOwner}
                currentUserId={user.id}
              />
            </div>

            {/* Chat Box */}
            <div className="bg-gray-900 border-4 border-yellow-400 p-6" style={{ fontFamily: 'monospace', boxShadow: '0 8px 0 #92400e' }}>
              <div className="flex items-center gap-3 mb-6">
                <MessageCircle className="w-6 h-6 text-yellow-400" strokeWidth={3} />
                <h2 className="text-xl font-black text-white uppercase">Battle Chat</h2>
              </div>
              <ChatBox
                messages={messages}
                setMessage={(msg) =>
                  socket.emit('sendMessage', {
                    code,
                    message: `${user.name}: ${msg}`,
                  })
                }
              />
            </div>
          </div>

          {/* Right Column - Settings */}
          <div className="lg:col-span-1 space-y-6">
            {/* Staking Section */}
            {stakingInfo && (
              <div className="bg-gray-900 border-4 border-yellow-400 p-6" style={{ fontFamily: 'monospace', boxShadow: '0 8px 0 #92400e' }}>
                <div className="flex items-center gap-3 mb-4">
                  <Coins className="w-6 h-6 text-yellow-400" strokeWidth={3} />
                  <h2 className="text-xl font-black text-white uppercase">Stake Required</h2>
                </div>
                
                <div className="mb-4 p-4 bg-gray-950 border-2 border-yellow-400/50">
                  <div className="text-sm text-yellow-400 font-black uppercase mb-2">Stake Amount</div>
                  <div className="text-2xl font-black text-white">{stakingInfo.stakeAmount} {currencySymbol}</div>
                </div>

                {/* Staking Progress */}
                {stakingProgress && (
                  <div className="mb-4 p-4 bg-gray-950 border-2 border-gray-700">
                    <div className="text-xs text-gray-400 font-black uppercase mb-2">Progress</div>
                    <div className="text-white font-black" style={{ fontFamily: 'monospace' }}>
                      {stakingProgress.playersStaked} / {stakingProgress.totalPlayers} players staked
                    </div>
                    {stakingProgress.stakedPlayer && (
                      <div className="text-xs text-green-400 mt-1">
                        ✓ {stakingProgress.stakedPlayer} staked
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons - Sequential Flow */}
                {!hasStaked && (
                  <div className="space-y-3">
                    {!isConnected && (
                      <div className="p-3 bg-red-500/20 border-2 border-red-500 text-red-400 text-sm font-black uppercase text-center">
                        Connect wallet to stake
                      </div>
                    )}
                    
                    {/* Step 1: Player A creates match - ONLY show create button for step 'create' and if isPlayerA */}
                    {stakingInfo.step === 'create' && isPlayerA && isConnected && (
                      <button
                        onClick={handleCreateStake}
                        disabled={stakingStatus === 'creating'}
                        className="w-full py-3 bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-black border-4 border-yellow-700 hover:border-yellow-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 uppercase"
                        style={{ fontFamily: 'monospace', boxShadow: '0 6px 0 #92400e' }}
                      >
                        {stakingStatus === 'creating' ? (
                          <>
                            <Loader className="w-4 h-4 animate-spin" strokeWidth={3} />
                            Creating Match...
                          </>
                        ) : (
                          <>Create Match & Stake {stakingInfo.stakeAmount} {currencySymbol}</>
                        )}
                      </button>
                    )}

                    {/* Step 2: Player B joins after Player A creates - ONLY show join button for step 'join' and if isPlayerB */}
                    {stakingInfo.step === 'join' && isPlayerB && isConnected && (
                      <button
                        onClick={handleJoinStake}
                        disabled={stakingStatus === 'joining'}
                        className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-black border-4 border-blue-700 hover:border-blue-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 uppercase"
                        style={{ fontFamily: 'monospace', boxShadow: '0 6px 0 #1e40af' }}
                      >
                        {stakingStatus === 'joining' ? (
                          <>
                            <Loader className="w-4 h-4 animate-spin" strokeWidth={3} />
                            Joining Match...
                          </>
                        ) : (
                          <>Join Match & Stake {stakingInfo.stakeAmount} {currencySymbol}</>
                        )}
                      </button>
                    )}

                    {/* Waiting states */}
                    {stakingInfo.step === 'create' && !isPlayerA && (
                      <div className="p-3 bg-gray-800 border-2 border-gray-700 text-gray-400 text-sm font-black uppercase text-center">
                        Waiting for match creator to stake...
                      </div>
                    )}

                    {stakingInfo.step === 'join' && !isPlayerB && (
                      <div className="p-3 bg-gray-800 border-2 border-gray-700 text-gray-400 text-sm font-black uppercase text-center">
                        Match created! Waiting for other player to join...
                      </div>
                    )}
                  </div>
                )}

                {hasStaked && (
                  <div className="p-3 bg-green-500/20 border-2 border-green-500 text-green-400 text-sm font-black uppercase text-center">
                    ✓ You have staked successfully!
                  </div>
                )}
              </div>
            )}

            {/* Settings */}
            <div className="bg-gray-900 border-4 border-yellow-400 p-6 sticky top-6" style={{ fontFamily: 'monospace', boxShadow: '0 8px 0 #92400e' }}>
              <div className="flex items-center gap-3 mb-6">
                <Settings className="w-6 h-6 text-yellow-400" strokeWidth={3} />
                <h2 className="text-xl font-black text-white uppercase">Settings</h2>
                {isOwner && (
                  <span className="px-2 py-1 bg-yellow-400 text-black text-xs font-black uppercase border-2 border-yellow-600">
                    HOST
                  </span>
                )}
              </div>
              
              <GameSettings
                lobby={lobby}
                isOwner={isOwner}
                gameSettings={gameSettings}
                setGameSettings={setGameSettings}
                onUpdateSettings={(updated) => {
                  socket.emit('updateGameSettings', {
                    code,
                    settings: updated,
                  });
                }}
                onStartGame={() => {
                  if (lobby.players.length < 2)
                    return setError('Need at least 2 players to start');
                  const required = ['gameTime', 'map', 'gameType'];
                  const missing = required.filter((k) => !gameSettings[k]);
                  if (missing.length)
                    return setError(`Please set: ${missing.join(', ')}`);
                  if (
                    gameSettings.gameType === 'rated' &&
                    (!gameSettings.stake || gameSettings.stake <= 0)
                  )
                    return setError('Set valid stake for rated battle');
                  socket.emit('startGame', { code });
                }}
                onLeaveLobby={() => {
                  socket.emit('leaveLobby', { code, playerId: user.id });
                  navigate('/battle');
                }}
              />

              {/* Start Game Button */}
              {isOwner && (
                <button
                  onClick={() => {
                    if (lobby.players.length < 2)
                      return setError('Need at least 2 players to start');
                    const required = ['gameTime', 'map', 'gameType'];
                    const missing = required.filter((k) => !gameSettings[k]);
                    if (missing.length)
                      return setError(`Please set: ${missing.join(', ')}`);
                    socket.emit('startGame', { code });
                  }}
                  className="w-full mt-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-black font-black border-4 border-green-700 hover:border-green-400 transition-all duration-300 flex items-center justify-center gap-3 uppercase"
                  style={{ fontFamily: 'monospace', boxShadow: '0 8px 0 #166534', textShadow: 'none', filter: 'none' }}
                >
                  <Play className="w-5 h-5" strokeWidth={3} />
                  Start Battle
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-6 p-4 bg-gray-900 border-4 border-red-500 text-red-400 text-center font-black uppercase animate-pulse" style={{ fontFamily: 'monospace' }}>
            ❌ {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default Waiting;