class ConnectionHandler {
  constructor(gameManager) {
    this.gameManager = gameManager;
  }

  handleConnection(socket) {
    console.log(`🎮 Game socket connected: ${socket.id}`);

    socket.on("joinGame", (data) => {
      this.handleJoinGame(socket, data);
    });

    socket.on("playerMove", (data) => {
      this.handlePlayerMove(socket, data);
    });

    socket.on("playerHealthUpdate", (data) => {
      this.handlePlayerHealthUpdate(socket, data);
    });

    socket.on("playerShoot", (data) => {
      this.handlePlayerShoot(socket, data);
    });

    socket.on("sendGameMessage", (data) => {
      this.handleGameMessage(socket, data);
    });

    socket.on("disconnect", () => {
      this.handleDisconnect(socket);
    });
  }

  handleJoinGame(socket, data) {
    const { gameCode, playerId } = data;
    this.gameManager.handlePlayerJoin(socket, gameCode, playerId);
  }

  handlePlayerMove(socket, data) {
    const { gameCode, playerId, x, y } = data;
    this.gameManager.handlePlayerMove(gameCode, playerId, x, y);
  }

  handlePlayerHealthUpdate(socket, data) {
    const { gameCode, playerId, health, shooterId, damage } = data;
    this.gameManager.handlePlayerHealthUpdate(gameCode, playerId, health, shooterId, damage);
  }

  handlePlayerShoot(socket, data) {
    const { gameCode, playerId, startX, startY, targetX, targetY, damage } = data;
    
    // Track shot for player stats
    const game = this.gameManager.getGame(gameCode);
    if (game) {
      game.recordShot(playerId);
    }
    
    // Broadcast the shoot event to all other players in the game
    socket.to(gameCode).emit("playerShoot", {
      playerId,
      startX,
      startY,
      targetX,
      targetY,
      damage
    });
  }

  handleGameMessage(socket, data) {
    this.gameManager.handleGameMessage(socket, data);
  }

  handleDisconnect(socket) {
    this.gameManager.handlePlayerDisconnect(socket);
  }
}

module.exports = ConnectionHandler;