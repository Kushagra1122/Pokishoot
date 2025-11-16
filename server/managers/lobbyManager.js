const { ethers } = require('ethers');

class LobbyManager {
  constructor(io, gameManager) {
    this.lobbies = new Map();
    this.gameManager = gameManager;
    this.io = io;

    console.log("🔧 LobbyManager initialized");
    setInterval(() => this.cleanupLobbies(), 1000 * 60 * 60);

    this.io.on("connection", (socket) => this.handleConnection(socket));
  }

  genCode() {
    let code;
    do {
      code = Math.random().toString(36).substring(2, 8).toUpperCase();
    } while (this.lobbies.has(code));
    
    console.log(`🔑 Generated new lobby code: ${code}`);
    return code;
  }

  createLobby(creatorId, creatorName, selectedPokemonDetails) {
    const code = this.genCode();
    const lobby = {
      code,
      createdAt: Date.now(),
      ownerId: creatorId,
      players: [
        {
          id: creatorId,
          name: creatorName,
          socketId: null,
          selectedPokemonDetails
        }
      ],
      gameSettings: {
        gameTime: null,
        map: null,
        gameType: null,
        stake: null
      },
      status: "waiting"
    };

    this.lobbies.set(code, lobby);
    console.log(`🎮 Lobby created: ${code} by ${creatorName} (${creatorId})`);
    return code;
  }

  validateLobby(code) {
    const normalizedCode = code.toUpperCase();
    const lobby = this.lobbies.get(normalizedCode);
    console.log(`🔍 Validating lobby ${normalizedCode}:`, lobby ? 'FOUND' : 'NOT FOUND');
    return lobby || null;
  }

  getLobby(code) {
    return this.lobbies.get(code.toUpperCase());
  }

  deleteLobby(code) {
    const lobby = this.lobbies.get(code.toUpperCase());
    if (lobby) {
      this.lobbies.delete(code.toUpperCase());
      console.log(`🗑️ Lobby ${code} deleted`);
      return true;
    }
    return false;
  }

  cleanupLobbies() {
    const now = Date.now();
    let cleaned = 0;
    for (const [code, lobby] of this.lobbies) {
      if (now - lobby.createdAt > 1000 * 60 * 60) {
        this.lobbies.delete(code);
        cleaned++;
        console.log(`🧹 Cleaned up old lobby: ${code}`);
      }
    }
    if (cleaned > 0) console.log(`📊 Total lobbies after cleanup: ${this.lobbies.size}`);
  }

  handleConnection(socket) {
    console.log(`🔌 Socket connected: ${socket.id}`);

    socket.on("joinLobby", (data) => {
      this.joinLobby(socket, data.code, data.playerName, data.playerId, data.selectedPokemonDetails);
    });

    socket.on("sendMessage", (data) => {
      this.sendMessage(socket, data.code, data.message);
    });

    socket.on("updateGameSettings", (data) => {
      this.updateGameSettings(socket, data.code, data.settings);
    });

    socket.on("startGame", (data) => {
      this.startGame(socket, data.code);
    });

    socket.on("playerStake", (data) => {
      this.handlePlayerStake(socket, data.code, data.playerId, data.stakeAmount, data.transactionHash);
    });

    socket.on("leaveLobby", (data) => {
      this.leaveLobby(socket, data.code, data.playerId);
    });

    socket.on("disconnect", (reason) => {
      this.handleDisconnect(socket);
    });
  }

  joinLobby(socket, code, playerName, playerId, selectedPokemonDetails) {
    const lobby = this.validateLobby(code);
    if (!lobby) return socket.emit("lobbyError", "Lobby not found");

    // Check if player already exists in lobby
    const existingPlayerIndex = lobby.players.findIndex(p => p.id === playerId);
    if (existingPlayerIndex !== -1) {
      // Update existing player's socket and Pokémon
      lobby.players[existingPlayerIndex].socketId = socket.id;
      lobby.players[existingPlayerIndex].selectedPokemonDetails = selectedPokemonDetails;
      console.log(`🔄 Player ${playerName} reconnected to lobby ${code}`);
    } else {
      // Add new player - no limit
      lobby.players.push({
        id: playerId,
        name: playerName,
        socketId: socket.id,
        selectedPokemonDetails
      });
      console.log(`✅ Player ${playerName} joined lobby ${code}`);
    }

    socket.join(code);
    socket.emit("lobbyData", lobby);
    this.io.to(code).emit("lobbyUpdate", lobby);
    this.io.to(code).emit("message", `⚡ ${playerName} joined the lobby`);
  }

  leaveLobby(socket, code, playerId) {
    console.log(`🚶 Player ${playerId} leaving lobby ${code}`);

    const lobby = this.validateLobby(code);
    if (!lobby) {
      console.log(`❌ Lobby ${code} not found`);
      return;
    }

    const playerIndex = lobby.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) {
      console.log(`❌ Player ${playerId} not found in lobby ${code}`);
      return;
    }

    const playerName = lobby.players[playerIndex].name;
    lobby.players.splice(playerIndex, 1);
    console.log(`✅ Player ${playerName} removed from lobby ${code}`);

    // Notify other players
    this.io.to(code).emit("message", `🚪 ${playerName} left the lobby`);

    if (playerId === lobby.ownerId && lobby.players.length > 0) {
      // Transfer ownership to next player
      lobby.ownerId = lobby.players[0].id;
      this.io.to(code).emit("message", `👑 ${lobby.players[0].name} is now the lobby owner`);
    }

    if (playerId === lobby.ownerId && lobby.players.length === 0) {
      // Owner left and no players remaining - delete lobby
      this.lobbies.delete(code);
      console.log(`🗑️ Lobby ${code} deleted (owner left, no players)`);
      return;
    }

    socket.leave(code);
    this.io.to(code).emit("lobbyUpdate", lobby);
    console.log(`📢 Lobby ${code} updated (${lobby.players.length} players remaining)`);
  }

  updateGameSettings(socket, code, settings) {
    console.log(`⚙️ Updating settings for lobby ${code}:`, settings);

    const lobby = this.validateLobby(code);
    if (!lobby) return socket.emit("lobbyError", "Lobby not found");

    const player = lobby.players.find(p => p.socketId === socket.id);
    if (!player || player.id !== lobby.ownerId) {
      return socket.emit("lobbyError", "Only lobby owner can change settings");
    }

    lobby.gameSettings = { ...lobby.gameSettings, ...settings };
    this.io.to(code).emit("lobbyUpdate", lobby);
    this.io.to(code).emit("message", "⚙️ Game settings updated");
    console.log(`✅ Settings updated for lobby ${code}:`, lobby.gameSettings);
  }

  // In the startGame method, remove the ready check
startGame(socket, code) {
  console.log(`🎯 Starting game for lobby ${code}`);
  const lobby = this.validateLobby(code);
  if (!lobby) return socket.emit("lobbyError", "Lobby not found");

  const player = lobby.players.find(p => p.socketId === socket.id);
  if (!player || player.id !== lobby.ownerId) {
    return socket.emit("lobbyError", "Only lobby owner can start the game");
  }

  if (lobby.players.length < 2) {
    return socket.emit("lobbyError", "Need at least 2 players to start");
  }

  const required = ["gameTime", "map", "gameType"];
  const missing = required.filter(k => !lobby.gameSettings[k]);
  if (missing.length) {
    return socket.emit("lobbyError", `Please set all game settings: ${missing.join(", ")}`);
  }

  if (lobby.gameSettings.gameType === "rated" && (!lobby.gameSettings.stake || lobby.gameSettings.stake <= 0)) {
    return socket.emit("lobbyError", "Please set a stake amount for rated battles");
  }

  // For rated games, collect stakes from all players before starting
  // Only if blockchain service is ready and stake is set
  if (lobby.gameSettings.gameType === "rated" && lobby.gameSettings.stake > 0) {
    const blockchainService = require('../services/blockchainService');
    if (blockchainService.isReady()) {
    this.collectStakesFromAllPlayers(lobby, socket);
    return;
    } else {
      // Blockchain not ready - allow rated game without staking
      console.log('⚠️  Blockchain service not ready, starting rated game without staking');
    }
  }

  lobby.status = "starting";
  console.log(`🚀 Game starting for lobby ${code} with ${lobby.players.length} players`);

  // Use GameManager to start the game
  this.gameManager.startGame(lobby);

  // Notify players that game is starting
  this.io.to(code).emit("gameStarting", {
    lobbyCode: code,
    settings: lobby.gameSettings,
    players: lobby.players
  });

  // Clean up lobby after game starts
  setTimeout(() => {
    if (this.lobbies.has(code)) {
      this.lobbies.delete(code);
      console.log(`🗑️ Lobby ${code} cleaned up after game start`);
    }
  }, 10000);
}

// New method to collect stakes from all players
async collectStakesFromAllPlayers(lobby, socket) {
  console.log(`💰 Collecting stakes from ${lobby.players.length} players for rated game`);
  
  // Prevent multiple simultaneous staking initiations
  if (lobby.stakingStatus) {
    console.log(`⚠️ Staking already in progress for lobby ${lobby.code}, ignoring duplicate call`);
    return;
  }
  
  try {
    const blockchainService = require('../services/blockchainService');
    const User = require('../models/User');

    // Check if blockchain service is ready
    if (!blockchainService.isReady()) {
      console.log('⚠️  Blockchain service not ready, skipping staking');
      // Start game without blockchain staking
      this.startGameWithoutBlockchain(lobby);
      return;
    }

    // Get wallet addresses for all players
    const playerAddresses = [];
    for (const player of lobby.players) {
      const user = await User.findById(player.id);
      if (!user || !user.walletAddress) {
        console.log(`⚠️  Player ${player.name} has no wallet - starting game without blockchain staking`);
        // Start game without blockchain staking
        this.startGameWithoutBlockchain(lobby);
        return;
      }
      playerAddresses.push({
        id: player.id,
        name: player.name,
        walletAddress: user.walletAddress
      });
    }

    if (playerAddresses.length !== 2) {
      console.log(`⚠️  Supports 2-player matches only, starting game without blockchain staking`);
      // Start game without blockchain staking
      this.startGameWithoutBlockchain(lobby);
      return;
    }

    // Generate match ID (same as game code hash)
    const matchId = blockchainService.generateMatchId(lobby.code);
    const stakeAmount = lobby.gameSettings.stake.toString();

    // Initialize staking status
    lobby.stakingStatus = {
      matchId: matchId,
      gameId: matchId, // Keep for backward compatibility
      totalStake: 0,
      playersStaked: 0,
      playerStakes: {},
      stakeAmount: stakeAmount,
      contractAddress: process.env.MATCH_ESCROW_CONTRACT_ADDRESS || blockchainService.contractAddress,
      playerAddresses: playerAddresses,
      blockchainStatus: 'pending'
    };

    console.log(`💰 Staking initialized for lobby ${lobby.code}:`, {
      playerA: { id: playerAddresses[0].id, name: playerAddresses[0].name, wallet: playerAddresses[0].walletAddress },
      playerB: { id: playerAddresses[1].id, name: playerAddresses[1].name, wallet: playerAddresses[1].walletAddress },
      matchId: matchId,
      stakeAmount: stakeAmount
    });

    // First, notify only Player A to create the match
    const playerA = lobby.players.find(p => p.id === playerAddresses[0].id);
    if (!playerA) {
      console.error(`❌ Player A not found in lobby ${lobby.code} when initiating staking`, {
        playerAId: playerAddresses[0].id,
        playersInLobby: lobby.players.map(p => ({ id: p.id, name: p.name }))
      });
      socket.emit("lobbyError", "Player A not found in lobby");
      return;
    }
    
    const playerASocket = playerA.socketId ? this.io.sockets.sockets.get(playerA.socketId) : null;
    if (playerASocket) {
      console.log(`📢 Notifying Player A (${playerA.name}) to create match and stake in lobby ${lobby.code}`);
      playerASocket.emit("stakeRequired", {
        step: "create",
        matchId: matchId,
        gameId: matchId,
        stakeAmount: stakeAmount,
        totalPlayers: lobby.players.length,
        contractAddress: lobby.stakingStatus.contractAddress,
        playerA: playerAddresses[0].walletAddress,
        playerB: playerAddresses[1].walletAddress,
        playerAId: playerAddresses[0].id,
        playerBId: playerAddresses[1].id,
        message: `Create match and stake ${stakeAmount} GLMR`
      });
      console.log(`✅ StakeRequired event sent to Player A (${playerA.name})`);
    } else {
      console.error(`❌ Player A socket not found in lobby ${lobby.code}`, {
        playerAName: playerA.name,
        playerAId: playerA.id,
        socketId: playerA.socketId,
        note: 'Player A may have disconnected'
      });
      socket.emit("lobbyError", `Player A (${playerA.name}) is not connected. Please ensure all players are connected.`);
      return;
    }

    // Clear any existing timeout first
    if (lobby.stakingTimeout) {
      clearTimeout(lobby.stakingTimeout);
      lobby.stakingTimeout = null;
      console.log(`🧹 Cleared existing timeout for lobby ${lobby.code}`);
    }

    // Set a timeout for staking (60 seconds)
    const timeoutDuration = 60000; // 60 seconds
    const timeoutStartTime = Date.now();
    lobby.stakingTimeoutStartTime = timeoutStartTime; // Store start time for validation
    
    lobby.stakingTimeout = setTimeout(() => {
      const elapsed = Date.now() - timeoutStartTime;
      console.log(`⏰ Timeout callback fired for lobby ${lobby.code}, elapsed: ${elapsed}ms`);
      
      // Validate that enough time has passed (allow 1 second tolerance for timing issues)
      if (elapsed < timeoutDuration - 1000) {
        console.error(`❌ Timeout fired too early! Expected ${timeoutDuration}ms, got ${elapsed}ms. Ignoring.`);
        return;
      }
      
      // Only handle timeout if staking is still in progress
      if (lobby.stakingStatus && lobby.stakingStatus.playersStaked < lobby.players.length) {
        this.handleStakingTimeout(lobby);
      } else {
        console.log(`ℹ️ Timeout fired but staking already complete or cancelled for lobby ${lobby.code}`);
      }
      lobby.stakingTimeout = null; // Clear reference after firing
      lobby.stakingTimeoutStartTime = null;
    }, timeoutDuration);

    console.log(`⏰ Staking timeout set for lobby ${lobby.code}, matchId: ${matchId}, duration: ${timeoutDuration}ms, startTime: ${timeoutStartTime}`);
  } catch (error) {
    console.error('Error collecting stakes:', error);
    socket.emit("lobbyError", "Failed to initiate staking process: " + error.message);
  }
}

// Handle individual player staking
async handlePlayerStake(socket, code, playerId, stakeAmount, transactionHash) {
  try {
    const lobby = this.validateLobby(code);
    if (!lobby) {
      console.error(`❌ Lobby ${code} not found when processing stake`);
      return socket.emit("lobbyError", "Lobby not found");
    }

    if (!lobby.stakingStatus) {
      console.error(`❌ No staking in progress for lobby ${code}`);
      return socket.emit("lobbyError", "No staking in progress");
    }

    const player = lobby.players.find(p => String(p.id) === String(playerId));
    if (!player) {
      console.error(`❌ Player not found in lobby ${code}:`, {
        playerId,
        playerIdsInLobby: lobby.players.map(p => p.id),
        playerNames: lobby.players.map(p => p.name)
      });
      return socket.emit("lobbyError", "Player not found in lobby");
    }

    // Normalize playerId to string for consistent key usage
    const playerIdStr = String(playerId);

    if (lobby.stakingStatus.playerStakes[playerIdStr]) {
      console.log(`⚠️ Player ${player.name} already staked in lobby ${code}`);
      return socket.emit("lobbyError", "Already staked");
    }

    if (!transactionHash || typeof transactionHash !== 'string' || transactionHash.trim() === '') {
      console.error(`❌ Invalid transaction hash from player ${player.name} in lobby ${code}`);
      return socket.emit("lobbyError", "Invalid transaction hash");
    }

    if (!stakeAmount || isNaN(Number(stakeAmount)) || Number(stakeAmount) <= 0) {
      console.error(`❌ Invalid stake amount from player ${player.name} in lobby ${code}: ${stakeAmount}`);
      return socket.emit("lobbyError", "Invalid stake amount");
    }

    if (Number(stakeAmount) !== Number(lobby.stakingStatus.stakeAmount)) {
      console.error(`❌ Stake amount mismatch for player ${player.name} in lobby ${code}:`, {
        received: stakeAmount,
        expected: lobby.stakingStatus.stakeAmount
      });
      return socket.emit("lobbyError", `Incorrect stake amount. Expected: ${lobby.stakingStatus.stakeAmount} GLMR`);
    }

    // Record the stake (use string key for consistency)
    lobby.stakingStatus.playerStakes[playerIdStr] = {
      amount: stakeAmount,
      transactionHash: transactionHash,
      timestamp: Date.now()
    };
    lobby.stakingStatus.playersStaked++;
    lobby.stakingStatus.totalStake += Number(stakeAmount);

    console.log(`✅ Player ${player.name} staked ${stakeAmount} GLMR in lobby ${code}`);
    console.log(`🔍 Staking debug:`, {
      stakedPlayerId: String(playerId),
      playerAId: String(lobby.stakingStatus.playerAddresses[0]?.id),
      isPlayerA: String(playerId) === String(lobby.stakingStatus.playerAddresses[0]?.id),
      playersStaked: lobby.stakingStatus.playersStaked,
      totalPlayers: lobby.players.length
    });

    // Notify all players of staking progress
    this.io.to(code).emit("stakingProgress", {
      playersStaked: lobby.stakingStatus.playersStaked,
      totalPlayers: lobby.players.length,
      totalStake: lobby.stakingStatus.totalStake,
      stakedPlayer: player.name
    });

    // If Player A just staked (created match), notify Player B to join and reset timeout
    if (String(playerId) === String(lobby.stakingStatus.playerAddresses[0]?.id) && lobby.stakingStatus.playersStaked === 1) {
      const playerB = lobby.players.find(p => String(p.id) === String(lobby.stakingStatus.playerAddresses[1]?.id));
      
      if (!playerB) {
        console.error(`❌ Player B not found in lobby ${code}`, {
          playerBId: lobby.stakingStatus.playerAddresses[1]?.id,
          playersInLobby: lobby.players.map(p => ({ id: p.id, name: p.name }))
        });
      } else if (!playerB.socketId) {
        console.error(`❌ Player B socket not connected in lobby ${code}`, {
          playerBName: playerB.name,
          playerBId: playerB.id,
          note: 'Player B may have disconnected or not yet connected'
        });
      } else {
        const playerBSocket = this.io.sockets.sockets.get(playerB.socketId);
        
        if (playerBSocket) {
          // Reset timeout to give Player B a full 60 seconds
          if (lobby.stakingTimeout) {
            clearTimeout(lobby.stakingTimeout);
            lobby.stakingTimeout = null;
            console.log(`🔄 Resetting timeout for Player B in lobby ${code}`);
          }
          
          const timeoutDuration = 60000; // 60 seconds
          const timeoutStartTime = Date.now();
          lobby.stakingTimeoutStartTime = timeoutStartTime;
          
          lobby.stakingTimeout = setTimeout(() => {
            const elapsed = Date.now() - timeoutStartTime;
            console.log(`⏰ Timeout callback fired for lobby ${code} (Player B), elapsed: ${elapsed}ms`);
            
            // Validate that enough time has passed (allow 1 second tolerance for timing issues)
            if (elapsed < timeoutDuration - 1000) {
              console.error(`❌ Timeout fired too early! Expected ${timeoutDuration}ms, got ${elapsed}ms. Ignoring.`);
              return;
            }
            
            // Only handle timeout if staking is still in progress
            if (lobby.stakingStatus && lobby.stakingStatus.playersStaked < lobby.players.length) {
              this.handleStakingTimeout(lobby);
            } else {
              console.log(`ℹ️ Timeout fired but staking already complete or cancelled for lobby ${code}`);
            }
            lobby.stakingTimeout = null;
            lobby.stakingTimeoutStartTime = null;
          }, timeoutDuration);
          
          console.log(`⏰ Staking timeout reset for Player B in lobby ${code}, duration: ${timeoutDuration}ms, startTime: ${timeoutStartTime}`);
          
          console.log(`📢 Notifying Player B (${playerB.name}) to stake in lobby ${code}`);
          playerBSocket.emit("stakeRequired", {
            step: "join",
            matchId: lobby.stakingStatus.matchId,
            gameId: lobby.stakingStatus.matchId,
            stakeAmount: lobby.stakingStatus.stakeAmount,
            totalPlayers: lobby.players.length,
            contractAddress: lobby.stakingStatus.contractAddress,
            playerA: lobby.stakingStatus.playerAddresses[0].walletAddress,
            playerB: lobby.stakingStatus.playerAddresses[1].walletAddress,
            playerAId: lobby.stakingStatus.playerAddresses[0].id,
            playerBId: lobby.stakingStatus.playerAddresses[1].id,
            message: `Join match and stake ${lobby.stakingStatus.stakeAmount} GLMR`
          });
          console.log(`✅ StakeRequired event sent to Player B (${playerB.name})`);
        } else {
          console.error(`❌ Player B socket not found in socket manager for lobby ${code}`, {
            playerBName: playerB.name,
            playerBId: playerB.id,
            socketId: playerB.socketId,
            note: 'Socket may have disconnected'
          });
        }
      }
    }

    // Check if all players have staked
    if (lobby.stakingStatus.playersStaked === lobby.players.length) {
      this.startGameAfterStaking(lobby);
    }
  } catch (error) {
    console.error(`❌ Error processing stake for player ${playerId} in lobby ${code}:`, error);
    socket.emit("lobbyError", `Failed to process stake: ${error.message || 'Unknown error'}`);
  }
}

// Start game after all players have staked
startGameAfterStaking(lobby) {
  console.log(`🎯 All players staked! Starting rated game for lobby ${lobby.code}`);
  
  // Clear staking timeout
  if (lobby.stakingTimeout) {
    const elapsed = lobby.stakingTimeoutStartTime ? Date.now() - lobby.stakingTimeoutStartTime : 0;
    clearTimeout(lobby.stakingTimeout);
    lobby.stakingTimeout = null;
    lobby.stakingTimeoutStartTime = null;
    console.log(`🧹 Cleared staking timeout for lobby ${lobby.code} (elapsed: ${elapsed}ms)`);
  }

  lobby.status = "starting";
  
  // Format stakingInfo with transaction hashes for Match model
  const stakingInfo = {
    matchId: lobby.stakingStatus.matchId,
    gameId: lobby.stakingStatus.matchId, // Keep for backward compatibility
    totalStake: lobby.stakingStatus.totalStake,
    stakeAmount: lobby.stakingStatus.stakeAmount,
    contractAddress: lobby.stakingStatus.contractAddress,
    blockchainStatus: lobby.stakingStatus.blockchainStatus || 'joined',
    // Extract transaction hashes from playerStakes
    createMatchTxHash: null,
    joinMatchTxHash: null,
    stakes: []
  };

  // Get transaction hashes from player stakes
  const playerAId = String(lobby.stakingStatus.playerAddresses[0]?.id);
  const playerBId = String(lobby.stakingStatus.playerAddresses[1]?.id);
  
  if (lobby.stakingStatus.playerStakes[playerAId]) {
    stakingInfo.createMatchTxHash = lobby.stakingStatus.playerStakes[playerAId].transactionHash;
    stakingInfo.stakes.push({
      playerId: lobby.stakingStatus.playerAddresses[0].id,
      walletAddress: lobby.stakingStatus.playerAddresses[0].walletAddress,
      amount: lobby.stakingStatus.playerStakes[playerAId].amount,
      transactionHash: lobby.stakingStatus.playerStakes[playerAId].transactionHash,
      deposited: true
    });
  }
  
  if (lobby.stakingStatus.playerStakes[playerBId]) {
    stakingInfo.joinMatchTxHash = lobby.stakingStatus.playerStakes[playerBId].transactionHash;
    stakingInfo.stakes.push({
      playerId: lobby.stakingStatus.playerAddresses[1].id,
      walletAddress: lobby.stakingStatus.playerAddresses[1].walletAddress,
      amount: lobby.stakingStatus.playerStakes[playerBId].amount,
      transactionHash: lobby.stakingStatus.playerStakes[playerBId].transactionHash,
      deposited: true
    });
  }

  // Store formatted stakingInfo in lobby for gameManager
  lobby.stakingInfo = stakingInfo;
  
  // Use GameManager to start the game (passes stakingInfo via lobby)
  this.gameManager.startGame(lobby);

  // Notify players that game is starting
  this.io.to(lobby.code).emit("gameStarting", {
    lobbyCode: lobby.code,
    settings: lobby.gameSettings,
    players: lobby.players,
    stakingInfo: stakingInfo
  });

  // Clean up lobby after game starts
  setTimeout(() => {
    if (this.lobbies.has(lobby.code)) {
      this.lobbies.delete(lobby.code);
      console.log(`🗑️ Lobby ${lobby.code} cleaned up after game start`);
    }
  }, 10000);
}

// Start game without blockchain staking (backward compatibility)
startGameWithoutBlockchain(lobby) {
  console.log(`🚀 Starting game without blockchain staking for lobby ${lobby.code}`);
  
  lobby.status = "starting";
  
  // Use GameManager to start the game (without stakingInfo)
  this.gameManager.startGame(lobby);

  // Notify players that game is starting
  this.io.to(lobby.code).emit("gameStarting", {
    lobbyCode: lobby.code,
    settings: lobby.gameSettings,
    players: lobby.players
  });

  // Clean up lobby after game starts
  setTimeout(() => {
    if (this.lobbies.has(lobby.code)) {
      this.lobbies.delete(lobby.code);
      console.log(`🗑️ Lobby ${lobby.code} cleaned up after game start`);
    }
  }, 10000);
}

// Handle staking timeout
handleStakingTimeout(lobby) {
  console.log(`⏰ Staking timeout reached for lobby ${lobby.code}`);
  
  // Clear the timeout reference (should already be null if called from timeout callback)
  if (lobby.stakingTimeout) {
    clearTimeout(lobby.stakingTimeout);
    lobby.stakingTimeout = null;
    lobby.stakingTimeoutStartTime = null;
    console.log(`🧹 Cleared timeout reference in handleStakingTimeout for lobby ${lobby.code}`);
  }
  
  if (!lobby.stakingStatus) {
    console.log(`⚠️ No staking status found for lobby ${lobby.code}`);
    return;
  }
  
  // Check if all players have already staked (race condition check)
  if (lobby.stakingStatus.playersStaked >= lobby.players.length) {
    console.log(`✅ All players already staked (${lobby.stakingStatus.playersStaked}/${lobby.players.length}), timeout fired too late`);
    return;
  }
  
  // Get staked player IDs as strings for comparison
  const stakedPlayerIds = Object.keys(lobby.stakingStatus.playerStakes).map(id => String(id));
  
  // Filter out players who haven't staked (compare as strings)
  const unstakedPlayers = lobby.players.filter(p => !stakedPlayerIds.includes(String(p.id)));
  
  console.log(`📊 Staking status: ${lobby.stakingStatus.playersStaked}/${lobby.players.length} players staked`);
  console.log(`📊 Staked players: ${stakedPlayerIds.join(', ')}`);
  console.log(`📊 Unstaked players: ${unstakedPlayers.map(p => p.name).join(', ')}`);
  
  if (unstakedPlayers.length > 0) {
    console.log(`⚠️ Removing ${unstakedPlayers.length} unstaked players from lobby ${lobby.code}`);
    // Keep only staked players
    lobby.players = lobby.players.filter(p => stakedPlayerIds.includes(String(p.id)));
    
    // Notify about removed players
    this.io.to(lobby.code).emit("playersRemoved", {
      removedPlayers: unstakedPlayers.map(p => p.name),
      reason: "Failed to stake in time"
    });
  }

  if (lobby.players.length >= 2 && lobby.stakingStatus.playersStaked >= 2) {
    console.log(`✅ ${lobby.players.length} players staked, starting game`);
    this.startGameAfterStaking(lobby);
  } else {
    console.log(`⚠️ Not enough players staked (${lobby.stakingStatus.playersStaked}/${lobby.players.length}). Need at least 2.`);
    this.io.to(lobby.code).emit("lobbyError", "Not enough players staked to start the game");
    lobby.status = "waiting";
    // Clear staking status to allow retry
    lobby.stakingStatus = null;
  }
}

  sendMessage(socket, code, message) {
    console.log(`💬 Message in ${code}: ${message}`);
    this.io.to(code).emit("message", message);
  }

  handleDisconnect(socket) {
    console.log(`🔌 Handling disconnect for socket: ${socket.id}`);

    for (const [code, lobby] of this.lobbies) {
      const playerIndex = lobby.players.findIndex(p => p.socketId === socket.id);
      if (playerIndex !== -1) {
        const player = lobby.players[playerIndex];
        console.log(`🚶 Player ${player.name} disconnected from lobby ${code}`);
        
        // Remove socket ID but keep player in lobby for potential reconnect
        lobby.players[playerIndex].socketId = null;
        
        this.io.to(code).emit("lobbyUpdate", lobby);
        this.io.to(code).emit("message", `🔌 ${player.name} disconnected`);
        break;
      }
    }
  }
}

module.exports = LobbyManager;