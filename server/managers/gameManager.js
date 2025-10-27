const Game = require('./Game');
const ConnectionHandler = require('./ConnectionHandlers');
const MapManager = require('./MapManager');
const matchController = require('../controllers/matchController');

class GameManager {
  constructor(io) {
    this.activeGames = new Map();
    this.io = io;
    this.connectionHandler = new ConnectionHandler(this);
    this.mapManager = new MapManager();

    console.log("🎮 GameManager initialized");
    this.io.on("connection", (socket) => this.connectionHandler.handleConnection(socket));
  }

  startGame(lobbyData) {
    const { code, players, gameSettings, stakingInfo } = lobbyData;
    
    if (this.activeGames.has(code)) {
      console.log(`⚠️ Game ${code} already exists`);
      return this.activeGames.get(code);
    }

    const mapData = this.mapManager.loadMapData(gameSettings?.map || 'snow');
    const spawnPositions = this.mapManager.findValidSpawnPositions(mapData, players.length);

    const game = new Game(code, players, gameSettings, mapData, spawnPositions, stakingInfo);
    this.activeGames.set(code, game);

    console.log(`🎯 Game started for lobby ${code}`);
    console.log(`📍 Spawned ${players.length} players at valid positions`);
    if (stakingInfo) {
      console.log(`💰 Total stake pool: ${stakingInfo.totalStake} ETH`);
    }

    // Send game state to each player individually
    players.forEach(player => {
      const playerSocket = this.io.sockets.sockets.get(player.socketId);
      if (playerSocket) {
        playerSocket.join(code);
        playerSocket.emit("gameStarted", game.sanitizeForPlayer(player.id));
      } else {
        console.log(`⚠️ Socket for player ${player.name} not connected yet`);
      }
    });

    game.startTimer((gameCode, winnerId, reason) => {
      this.endGame(gameCode, winnerId, reason);
    }, this.io);

    return game;
  }

  getGame(gameCode) {
    return this.activeGames.get(gameCode);
  }

  handlePlayerMove(gameCode, playerId, x, y) {
    const game = this.getGame(gameCode);
    if (!game) return;

    game.updatePlayerPosition(playerId, x, y);
    this.io.to(gameCode).emit("playerMoved", { playerId, x, y });
  }

  handlePlayerHealthUpdate(gameCode, playerId, newHealth, shooterId = null, damage = 0) {
    const game = this.getGame(gameCode);
    if (!game) return;

    const player = game.updatePlayerHealth(playerId, newHealth);
    if (!player) return;

    // Record damage stats
    if (damage > 0 && shooterId && shooterId !== playerId) {
      game.recordHit(shooterId, damage);
      game.recordDamageReceived(playerId, damage);
    }

    console.log(`💗 Health update - ${player.name}: ${player.health}HP`);

    this.io.to(gameCode).emit("playerHealthUpdate", {
      playerId,
      health: player.health
    });

    if (player.health <= 0) {
      console.log(`💀 Player ${player.name} health reached 0 - triggering defeat`);
      this.handlePlayerDefeated(gameCode, playerId, shooterId);
    }
  }

  handlePlayerDefeated(gameCode, playerId, killerId = null) {
    const game = this.getGame(gameCode);
    if (!game) return;

    const defeatedPlayer = game.getPlayer(playerId);
    if (!defeatedPlayer) return;

    console.log(`💀 Player ${defeatedPlayer.name} defeated in game ${gameCode}`);
    
    // Add kill to the killer if specified
    if (killerId && killerId !== playerId) {
      game.addKill(killerId, playerId);
    }
    
    this.io.to(gameCode).emit("playerDefeated", {
      playerId,
      playerName: defeatedPlayer.name,
      killerId: killerId
    });

    // Emit leaderboard update
    this.emitLeaderboardUpdate(gameCode);

    // Respawn the defeated player after a short delay
    setTimeout(() => {
      this.handlePlayerRespawn(gameCode, playerId);
    }, 2000); // 2 second respawn delay
  }

  handlePlayerRespawn(gameCode, playerId, retryCount = 0) {
    const game = this.getGame(gameCode);
    if (!game) {
      console.log(`❌ Game ${gameCode} not found for respawn`);
      return;
    }

    const player = game.getPlayer(playerId);
    if (!player) {
      console.log(`❌ Player ${playerId} not found for respawn`);
      return;
    }

    // Prevent infinite recursion
    if (retryCount > 5) {
      console.log(`💀 Max retry attempts reached for respawn, using emergency fallback`);
      const tileWidth = game.mapData.tilewidth || 32;
      const tileHeight = game.mapData.tileheight || 32;
      const pixelPosition = {
        x: tileWidth + tileWidth / 2,
        y: tileHeight + tileHeight / 2
      };
      
      const respawnedPlayer = game.respawnPlayer(playerId, pixelPosition);
      if (respawnedPlayer) {
        this.io.to(gameCode).emit("playerRespawned", {
          playerId,
          playerName: respawnedPlayer.name,
          health: respawnedPlayer.health,
          position: respawnedPlayer.position
        });
      }
      return;
    }

    // Get current positions of all other alive players to avoid spawning on top of them
    const existingPlayerPositions = game.players
      .filter(p => p.id !== playerId && p.health > 0)
      .map(p => {
        // Convert pixel coordinates to tile coordinates for collision checking
        const tileWidth = game.mapData.tilewidth || 32;
        const tileHeight = game.mapData.tileheight || 32;
        return {
          x: Math.floor(p.position.x / tileWidth),
          y: Math.floor(p.position.y / tileHeight)
        };
      });

    console.log(`🎯 Finding respawn position for ${player.name}, avoiding ${existingPlayerPositions.length} existing players (retry ${retryCount})`);

    // Find a safe spawn position, avoiding existing players AND obstacles
    const spawnPositions = this.mapManager.findValidSpawnPositions(
      game.mapData, 
      1, 
      existingPlayerPositions,
      true // Enable strict collision checking for respawn
    );
    
    if (!spawnPositions || spawnPositions.length === 0) {
      console.log(`⚠️ No valid spawn positions found, using emergency fallback`);
      const tilePosition = this.findEmergencyRespawnPosition(game, existingPlayerPositions);
      
      if (tilePosition) {
        spawnPositions.push(tilePosition);
        console.log(`🆘 Emergency respawn position found at (${tilePosition.x}, ${tilePosition.y})`);
      } else {
        // Ultimate fallback - use a corner position
        const tileWidth = game.mapData.tilewidth || 32;
        const tileHeight = game.mapData.tileheight || 32;
        const pixelPosition = {
          x: tileWidth + tileWidth / 2,
          y: tileHeight + tileHeight / 2
        };
        
        console.log(`💀 Using ultimate fallback position at pixel (${pixelPosition.x}, ${pixelPosition.y})`);
        
        // Respawn the player with full health at fallback position
        const respawnedPlayer = game.respawnPlayer(playerId, pixelPosition);
        if (!respawnedPlayer) {
          console.log(`❌ Failed to respawn player ${playerId}`);
          return;
        }

        console.log(`✨ Player ${respawnedPlayer.name} respawned at ultimate fallback position`);

        // Notify all players about the respawn
        this.io.to(gameCode).emit("playerRespawned", {
          playerId,
          playerName: respawnedPlayer.name,
          health: respawnedPlayer.health,
          position: respawnedPlayer.position
        });
        return;
      }
    }

    const tilePosition = spawnPositions[0];
    
    // Convert tile coordinates to pixel coordinates (centered on tile)
    const tileWidth = game.mapData.tilewidth || 32;
    const tileHeight = game.mapData.tileheight || 32;
    const pixelPosition = {
      x: tilePosition.x * tileWidth + tileWidth / 2,
      y: tilePosition.y * tileHeight + tileHeight / 2
    };

    console.log(`🎯 Respawn position - Tile: (${tilePosition.x}, ${tilePosition.y}) → Pixel: (${pixelPosition.x}, ${pixelPosition.y})`);

    // Verify this position is not an obstacle (double-check)
    const isValid = this.mapManager.isPositionStrictlyValid(game.mapData, tilePosition, existingPlayerPositions);
    if (!isValid) {
      console.log(`❌ Respawn position (${tilePosition.x}, ${tilePosition.y}) is invalid, finding alternative`);
      this.handlePlayerRespawn(gameCode, playerId, retryCount + 1); // Retry with incremented count
      return;
    }

    // Respawn the player with full health at new position
    const respawnedPlayer = game.respawnPlayer(playerId, pixelPosition);
    if (!respawnedPlayer) {
      console.log(`❌ Failed to respawn player ${playerId}`);
      return;
    }

    console.log(`✨ Player ${respawnedPlayer.name} respawned in game ${gameCode} at pixel (${pixelPosition.x}, ${pixelPosition.y})`);

    // Notify all players about the respawn
    this.io.to(gameCode).emit("playerRespawned", {
      playerId,
      playerName: respawnedPlayer.name,
      health: respawnedPlayer.health,
      position: respawnedPlayer.position
    });
  }

  findEmergencyRespawnPosition(game, existingPlayerPositions) {
    const mapData = game.mapData;
    const emergencyPositions = [
      // Try corners with some margin
      { x: 2, y: 2 },
      { x: mapData.width - 3, y: 2 },
      { x: 2, y: mapData.height - 3 },
      { x: mapData.width - 3, y: mapData.height - 3 },
      // Try center areas
      { x: Math.floor(mapData.width / 2), y: Math.floor(mapData.height / 2) },
      { x: Math.floor(mapData.width / 4), y: Math.floor(mapData.height / 2) },
      { x: Math.floor(mapData.width * 3/4), y: Math.floor(mapData.height / 2) },
      // Additional safe spots
      { x: Math.floor(mapData.width / 2), y: Math.floor(mapData.height / 4) },
      { x: Math.floor(mapData.width / 2), y: Math.floor(mapData.height * 3/4) }
    ];

    // Find the first emergency position that's not occupied by another player AND not an obstacle
    for (const pos of emergencyPositions) {
      // Check if position is occupied by another player
      const isOccupied = existingPlayerPositions.some(playerPos => 
        Math.abs(playerPos.x - pos.x) < 2 && Math.abs(playerPos.y - pos.y) < 2
      );
      
      // Check if position is valid (no obstacles) using MapManager's strict validation
      const isValidPosition = this.mapManager.isPositionStrictlyValid(mapData, pos, existingPlayerPositions);
      
      if (!isOccupied && isValidPosition && pos.x >= 0 && pos.x < mapData.width && pos.y >= 0 && pos.y < mapData.height) {
        console.log(`🆘 Emergency respawn position selected at (${pos.x}, ${pos.y}) - validated for obstacles`);
        return pos;
      }
    }

    // If all predefined positions failed, try a systematic search for any valid position
    console.log(`🚨 All emergency positions failed, searching systematically...`);
    for (let y = 1; y < mapData.height - 1; y++) {
      for (let x = 1; x < mapData.width - 1; x++) {
        const candidatePos = { x, y };
        
        // Check if position is occupied by another player
        const isOccupied = existingPlayerPositions.some(playerPos => 
          Math.abs(playerPos.x - candidatePos.x) < 2 && Math.abs(playerPos.y - candidatePos.y) < 2
        );
        
        // Check if position is valid (no obstacles) with strict validation
        const isValidPosition = this.mapManager.isPositionStrictlyValid(mapData, candidatePos, existingPlayerPositions);
        
        if (!isOccupied && isValidPosition) {
          console.log(`🔍 Systematic search found valid respawn at (${candidatePos.x}, ${candidatePos.y})`);
          return candidatePos;
        }
      }
    }

    // Absolute last resort - find ANY position that's not an obstacle, even if close to players
    console.log(`🚨 No valid positions found, using absolute fallback (may be near players)...`);
    for (let y = 1; y < mapData.height - 1; y++) {
      for (let x = 1; x < mapData.width - 1; x++) {
        const candidatePos = { x, y };
        
        // Only check for obstacles, ignore player proximity in absolute emergency
        const isValidPosition = this.mapManager.isPositionStrictlyValid(mapData, candidatePos, []);
        
        if (isValidPosition) {
          console.log(`⚠️ Absolute fallback respawn at (${candidatePos.x}, ${candidatePos.y}) - may be near players`);
          return candidatePos;
        }
      }
    }

    // If even that fails, use a corner and hope for the best
    console.log(`💀 Emergency fallback to corner - map may have serious issues`);
    return { x: 2, y: 2 };
  }

  handleGameMessage(socket, data) {
    const { gameCode, playerId, playerName, text } = data;
    const game = this.getGame(gameCode);
    
    if (!game) return socket.emit("gameError", "Game not found");
    
    const player = game.getPlayer(playerId);
    if (!player) return socket.emit("gameError", "Player not found in game");

    if (!this.validateMessage(text)) {
      return socket.emit("gameError", "Invalid message");
    }

    const messageData = game.createMessage(playerId, playerName || player.name, text.trim());
    console.log(`💬 Game message in ${gameCode} from ${player.name}: ${text.trim()}`);
    
    this.io.to(gameCode).emit("receiveGameMessage", messageData);
  }

  validateMessage(text) {
    return text && typeof text === 'string' && 
           text.trim().length > 0 && 
           text.trim().length <= 500;
  }

  handlePlayerDisconnect(socket) {
    console.log(`🎮 Socket disconnected: ${socket.id}`);

    for (const [gameCode, game] of this.activeGames) {
      const player = game.getPlayerBySocketId(socket.id);
      if (player) {
        game.updatePlayerConnection(player.id, null, false);
        this.io.to(gameCode).emit("playerDisconnected", {
          playerId: player.id,
          playerName: player.name,
        });
        break;
      }
    }
  }

  handlePlayerJoin(socket, gameCode, playerId) {
    const game = this.getGame(gameCode);
    if (!game) return socket.emit("gameError", "Game not found");

    const player = game.getPlayer(playerId);
    if (player) {
      game.updatePlayerConnection(player.id, socket.id, true);
      socket.join(gameCode);
      console.log(`✅ Player ${player.name} joined game ${gameCode} at tile position (${player.position.x}, ${player.position.y})`);

      socket.emit("gameState", game.sanitizeForPlayer(playerId));

      socket.to(gameCode).emit("playerJoined", {
        id: player.id,
        name: player.name,
        position: player.position,
        health: player.health,
        selectedPokemonDetails: player.selectedPokemonDetails
      });
    }
  }

  endGame(gameCode, winnerId, reason = "completed") {
    const game = this.getGame(gameCode);
    if (!game) return;

    // Calculate final survival time for all players
    game.players.forEach(player => {
      player.stats.survivalTime = Math.floor((Date.now() - player.stats.spawnTime) / 1000);
      player.stats.score = game.calculateScore(player);
    });

    // Sort players by score for final ranking
    const rankedPlayers = game.players.slice().sort((a, b) => {
      // Primary sort by score (descending)
      if (b.stats.score !== a.stats.score) return b.stats.score - a.stats.score;
      
      // Secondary sort by kills (descending)
      if (b.stats.kills !== a.stats.kills) return b.stats.kills - a.stats.kills;
      
      // Tertiary sort by K/D ratio (descending)
      const aKDRatio = a.stats.deaths === 0 ? a.stats.kills : a.stats.kills / a.stats.deaths;
      const bKDRatio = b.stats.deaths === 0 ? b.stats.kills : b.stats.kills / b.stats.deaths;
      return bKDRatio - aKDRatio;
    });

    game.end(winnerId);

    const winnerName = game.getPlayer(winnerId)?.name || "Unknown";
    console.log(`🏁 Game ${gameCode} ended. Winner: ${winnerName}`);
    
    const systemMessage = game.createSystemMessage(`🏁 Game Over! Winner: ${winnerName}`);
    this.io.to(gameCode).emit("receiveGameMessage", systemMessage);
    
    // Prepare final rankings with all stats
    const finalRankings = rankedPlayers.map((player, index) => ({
      rank: index + 1,
      id: player.id,
      name: player.name,
      kills: player.stats.kills,
      deaths: player.stats.deaths,
      assists: player.stats.assists || 0,
      score: player.stats.score,
      kdRatio: player.stats.deaths === 0 ? player.stats.kills : (player.stats.kills / player.stats.deaths).toFixed(2),
      damageDealt: player.stats.damageDealt || 0,
      survivalTime: player.stats.survivalTime || 0
    }));
    
    this.io.to(gameCode).emit("gameEnded", {
      gameId: gameCode,
      winner: winnerId,
      winnerName,
      reason,
      finalState: game.sanitize(),
      finalRankings
    });

    // Save match result to database (async, don't wait)
    this.saveMatchResult(game, winnerId, rankedPlayers, finalRankings);

    setTimeout(() => {
      this.activeGames.delete(gameCode);
      console.log(`🗑️ Cleaned up game ${gameCode}`);
    }, 30000);
  }

  async saveMatchResult(game, winnerId, rankedPlayers, finalRankings) {
    try {
      // Determine match type from settings
      const matchType = game.settings?.gameType === 'rated' ? 'rated' : 'friendly';
      
      // Prepare player performance data
      const playerPerformance = game.players.map(player => {
        const stats = player.stats;
        return {
          playerId: player.id,
          name: player.name,
          kills: stats.kills || 0,
          deaths: stats.deaths || 0,
          assists: stats.assists || 0,
          damageDealt: stats.damageDealt || 0,
          damageTaken: stats.damageTaken || 0,
          score: stats.score || 0,
          survivalTime: stats.survivalTime || 0,
          accuracy: stats.shotsFired > 0 ? (stats.shotsHit / stats.shotsFired) * 100 : 0,
          pokemon: player.selectedPokemonDetails ? {
            pokemonId: player.selectedPokemonDetails.id,
            sprite: player.selectedPokemonDetails.sprite,
            name: player.selectedPokemonDetails.name
          } : null
        };
      });

      // Create match data
      const matchData = {
        gameCode: game.code,
        matchType: matchType,
        gameSettings: {
          map: game.settings?.map || 'unknown',
          gameTime: game.settings?.gameTime || 5,
          gameType: game.settings?.gameType || 'friendly',
          winCondition: game.settings?.winCondition || 'score',
          killLimit: game.settings?.killLimit,
          scoreLimit: game.settings?.scoreLimit
        },
        players: playerPerformance,
        winner: winnerId,
        winnerName: game.getPlayer(winnerId)?.name || "Unknown",
        duration: Math.floor((Date.now() - game.createdAt) / 1000),
        startedAt: new Date(game.createdAt),
        endedAt: new Date(),
        status: 'completed',
        stakingInfo: game.stakingInfo || null,
        finalRankings: finalRankings
      };

      // Save to database
      await matchController.saveMatchResult(matchData);
      console.log(`✅ Match result saved for game ${game.code}`);
    } catch (error) {
      console.error('❌ Error saving match result:', error);
      // Don't throw - we don't want to block game cleanup
    }
  }

  emitLeaderboardUpdate(gameCode) {
    const game = this.getGame(gameCode);
    if (!game) return;

    // Calculate current scores for all players
    game.players.forEach(player => {
      player.stats.score = game.calculateScore(player);
    });

    // Prepare leaderboard data
    const leaderboardData = game.players.map(player => ({
      id: player.id,
      name: player.name,
      kills: player.stats.kills || 0,
      deaths: player.stats.deaths || 0,
      assists: player.stats.assists || 0,
      score: player.stats.score || 0,
      health: player.health || 0,
      damageDealt: player.stats.damageDealt || 0,
      survivalTime: player.stats.survivalTime || 0,
      accuracy: player.stats.shotsFired > 0 
        ? ((player.stats.shotsHit / player.stats.shotsFired) * 100).toFixed(1)
        : '0.0'
    })).sort((a, b) => b.score - a.score);

    // Emit to all players in the game
    this.io.to(gameCode).emit("leaderboardUpdate", leaderboardData);
  }
}

module.exports = GameManager;