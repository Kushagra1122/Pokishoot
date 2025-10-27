class Game {
  constructor(code, players, settings, mapData, spawnPositions, stakingInfo = null) {
    this.id = code;
    this.code = code;
    this.players = this.initializePlayers(players, spawnPositions);
    this.settings = settings;
    this.mapData = mapData;
    this.stakingInfo = stakingInfo;
    this.status = "running";
    this.createdAt = Date.now();
    this.endedAt = null;
    this.winner = null;
    
    const durationMinutes = Number(settings?.gameTime || 5);
    this.timeLeft = durationMinutes * 60;
    this.timerInterval = null;
    this.leaderboardInterval = null;
  }

  initializePlayers(players, spawnPositions) {
    return players.map((player, index) => ({
      id: player.id,
      name: player.name,
      socketId: player.socketId,
      selectedPokemonDetails: player.selectedPokemonDetails,
      health: 100,
      position: spawnPositions[index] || { x: 0, y: 0 },
      direction: 'down',
      isOnline: true,
      stats: {
        kills: 0,
        deaths: 0,
        assists: 0,
        score: 0,
        damageDealt: 0,
        damageTaken: 0,
        survivalTime: 0,
        shotsFired: 0,
        shotsHit: 0,
        spawnTime: Date.now()
      }
    }));
  }

  startTimer(onGameEnd, io) {
    console.log(`⏳ Timer started for game ${this.code} (${this.timeLeft}s)`);
    this.io = io; // Store reference to socket.io for timer updates

    this.timerInterval = setInterval(() => {
      this.timeLeft -= 1;

      // Emit timer update to all players in the game
      if (this.io) {
        this.io.to(this.code).emit("gameTimer", { timeLeft: this.timeLeft });
      }

      if (this.timeLeft <= 0) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;

        // Determine winner by highest score instead of random
        this.players.forEach(player => {
          player.stats.survivalTime = Math.floor((Date.now() - player.stats.spawnTime) / 1000);
          player.stats.score = this.calculateScore(player);
        });
        
        const sortedPlayers = this.players.slice().sort((a, b) => b.stats.score - a.stats.score);
        const winner = sortedPlayers[0];
        
        console.log(`🏁 Game time expired. Winner determined by score: ${winner?.name || 'Unknown'}`);
        onGameEnd(this.code, winner?.id || null, "time_up");
      }
    }, 1000);
  }

  getPlayer(playerId) {
    return this.players.find(p => p.id === playerId);
  }

  getPlayerBySocketId(socketId) {
    return this.players.find(p => p.socketId === socketId);
  }

  getAlivePlayers() {
    return this.players.filter(p => p.health > 0);
  }

  updatePlayerPosition(playerId, x, y) {
    const player = this.getPlayer(playerId);
    if (player) {
      player.position = { x, y };
    }
    return player;
  }

  updatePlayerHealth(playerId, newHealth) {
    const player = this.getPlayer(playerId);
    if (player) {
      player.health = Math.max(0, Math.min(100, newHealth));
    }
    return player;
  }

  respawnPlayer(playerId, newPosition) {
    const player = this.getPlayer(playerId);
    if (player) {
      console.log(`🔄 Respawning ${player.name} from ${player.health}HP to 100HP`);
      player.health = 100; // Full health on respawn
      player.position = newPosition; // New spawn position
      player.direction = 'down'; // Reset direction
      player.stats.deaths += 1; // Increment death count
      player.stats.spawnTime = Date.now(); // Reset spawn time
      player.stats.score = this.calculateScore(player); // Update score
      console.log(`✅ ${player.name} respawned at (${newPosition.x}, ${newPosition.y}) with ${player.health}HP (Deaths: ${player.stats.deaths})`);
    }
    return player;
  }

  addKill(killerId, victimId) {
    const killer = this.getPlayer(killerId);
    const victim = this.getPlayer(victimId);
    
    if (killer) {
      killer.stats.kills += 1;
      killer.stats.score = this.calculateScore(killer);
      console.log(`💀 ${killer.name} killed ${victim?.name || 'unknown'}! (Kills: ${killer.stats.kills})`);
    }
  }

  recordShot(playerId) {
    const player = this.getPlayer(playerId);
    if (player) {
      player.stats.shotsFired += 1;
    }
  }

  recordHit(playerId, damage) {
    const player = this.getPlayer(playerId);
    if (player) {
      player.stats.shotsHit += 1;
      player.stats.damageDealt += damage;
    }
  }

  recordDamageReceived(playerId, damage) {
    const player = this.getPlayer(playerId);
    if (player) {
      player.stats.damageTaken += damage;
    }
  }

  calculateScore(player) {
    // Enhanced scoring algorithm
    // Kills: +100 points
    const killPoints = player.stats.kills * 100;
    
    // Deaths: -50 points
    const deathPoints = player.stats.deaths * 50;
    
    // Assists: +25 points
    const assistPoints = player.stats.assists * 25;
    
    // Survival time bonus: +1 point per 10 seconds alive
    const survivalBonus = Math.floor(player.stats.survivalTime / 10);
    
    // Accuracy bonus: +10 points per 10% hit rate above 50%
    const accuracy = player.stats.shotsFired > 0 
      ? (player.stats.shotsHit / player.stats.shotsFired) * 100 
      : 0;
    const accuracyBonus = accuracy > 50 
      ? Math.floor((accuracy - 50) / 10) * 10 
      : 0;
    
    const score = killPoints - deathPoints + assistPoints + survivalBonus + accuracyBonus;
    
    return score;
  }

  updatePlayerConnection(playerId, socketId, isOnline) {
    const player = this.getPlayer(playerId);
    if (player) {
      player.socketId = socketId;
      player.isOnline = isOnline;
    }
    return player;
  }

  createMessage(playerId, playerName, text) {
    return {
      playerId,
      playerName,
      text: text.trim(),
      gameCode: this.code,
      timestamp: Date.now(),
      type: 'player'
    };
  }

  createSystemMessage(text) {
    return {
      playerId: 'system',
      playerName: 'System',
      text,
      gameCode: this.code,
      timestamp: Date.now(),
      type: 'system'
    };
  }

  sanitizeForPlayer(currentPlayerId) {
    return {
      id: this.id,
      code: this.code,
      players: this.players.map(player => ({
        id: player.id,
        name: player.name,
        health: player.health,
        selectedPokemonDetails: player.selectedPokemonDetails,
        position: player.position,
        direction: player.direction,
        isOnline: player.isOnline,
        isYou: player.id === currentPlayerId,
        stats: player.stats
      })),
      settings: this.settings,
      mapData: this.mapData,
      stakingInfo: this.stakingInfo,
      status: this.status,
      createdAt: this.createdAt,
      timeLeft: this.timeLeft,
      winner: this.winner,
    };
  }

  sanitize() {
    return {
      id: this.id,
      code: this.code,
      players: this.players.map(player => ({
        id: player.id,
        name: player.name,
        health: player.health,
        selectedPokemonDetails: player.selectedPokemonDetails,
        position: player.position,
        direction: player.direction,
        isOnline: player.isOnline
      })),
      settings: this.settings,
      mapData: this.mapData,
      status: this.status,
      createdAt: this.createdAt,
      timeLeft: this.timeLeft,
      winner: this.winner,
    };
  }

  end(winnerId) {
    this.status = "ended";
    this.winner = winnerId;
    this.endedAt = Date.now();

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }
}

module.exports = Game;