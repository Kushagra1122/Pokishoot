export default class SocketManager {
  constructor(scene) {
    this.scene = scene;
  }

  create() {
    if (!this.scene.socket) return;

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.scene.socket.on("playerMoved", this.handlePlayerMoved.bind(this));
    this.scene.socket.on("playerJoined", this.handlePlayerJoined.bind(this));
    this.scene.socket.on("playerLeft", this.handlePlayerLeft.bind(this));
    this.scene.socket.on("playerHealthUpdate", this.handlePlayerHealthUpdate.bind(this));
    this.scene.socket.on("playerDefeated", this.handlePlayerDefeated.bind(this));
    this.scene.socket.on("playerRespawned", this.handlePlayerRespawned.bind(this));
    this.scene.socket.on("playerShoot", this.handlePlayerShoot.bind(this));
  }

  handlePlayerMoved({ playerId, x, y }) {
    if (this.scene.players[playerId] && playerId !== this.scene.user.id) {
      const player = this.scene.players[playerId];
      // Smoothly move other players
      this.scene.tweens.add({
        targets: player.container,
        x: x,
        y: y,
        duration: 100,
        ease: 'Power2'
      });
    }
  }

  handlePlayerJoined(player) {
    if (player.id !== this.scene.user.id && !this.scene.players[player.id]) {
      const spriteKey = `player-${player.id}`;
      const spritePath = player.selectedPokemonDetails?.sprite;
      
      if (spritePath && !this.scene.textures.exists(spriteKey)) {
        this.scene.load.image(spriteKey, spritePath);
        
        this.scene.load.once('complete', () => {
          this.scene.playerManager.spawnPlayer(player);
        });
        
        this.scene.load.start();
      } else {
        this.scene.playerManager.spawnPlayer(player);
      }
    }
  }

  handlePlayerLeft(playerId) {
    this.scene.playerManager.removePlayer(playerId);
  }

  handlePlayerHealthUpdate({ playerId, health }) {
    console.log(`💗 Health update received - Player ${playerId}: ${health}HP`);
    
    if (this.scene.players[playerId]) {
      this.scene.players[playerId].health = health;
      this.scene.playerManager.updatePlayerHealthBar(playerId, health);
      
      // Log if it's the current player
      if (playerId === this.scene.user?.id) {
        console.log(`💗 My health is now: ${health}`);
      }
    }
  }

  handlePlayerDefeated({ playerId, playerName }) {
    console.log(`💀 ${playerName} was defeated!`);
    
    // Handle visual effects for defeated player
    if (this.scene.players[playerId]) {
      const player = this.scene.players[playerId];
      
      // Add death effect (fade out)
      if (player.container) {
        this.scene.tweens.add({
          targets: player.container,
          alpha: 0.3,
          duration: 500,
          ease: 'Power2'
        });
      }
    }
  }

  handlePlayerRespawned({ playerId, playerName, health, position }) {
    console.log(`✨ ${playerName} respawned!`);
    console.log(`🔍 Respawn data:`, { playerId, playerName, health, position });
    
    if (this.scene.players[playerId]) {
      const player = this.scene.players[playerId];
      console.log(`👤 Player found:`, player.name);
      
      // Update player data
      player.health = health;
      player.position = position;
      
      // Move player to new spawn position
      if (player.container) {
        console.log(`📍 Moving player to:`, position);
        player.container.x = position.x;
        player.container.y = position.y;
        
        // Restore full visibility
        this.scene.tweens.add({
          targets: player.container,
          alpha: 1,
          duration: 500,
          ease: 'Power2'
        });
        
        // Add respawn effect (scale bounce)
        this.scene.tweens.add({
          targets: player.container,
          scaleX: 1.2,
          scaleY: 1.2,
          duration: 200,
          ease: 'Power2',
          yoyo: true
        });
      } else {
        console.log(`❌ No container found for player ${playerId}`);
      }
      
      // Update health bar
      this.scene.playerManager.updatePlayerHealthBar(playerId, health);
      console.log(`💗 Health bar updated to: ${health}`);
    } else {
      console.log(`❌ Player ${playerId} not found in scene players`);
    }
  }

  handlePlayerShoot(data) {
    // Forward remote shooting to the shooting manager
    if (this.scene.shootingManager) {
      this.scene.shootingManager.handleRemoteShoot(data);
    }
  }

  destroy() {
    if (this.scene.socket) {
      this.scene.socket.off("playerMoved");
      this.scene.socket.off("playerJoined");
      this.scene.socket.off("playerLeft");
      this.scene.socket.off("playerHealthUpdate");
      this.scene.socket.off("playerDefeated");
      this.scene.socket.off("playerRespawned");
      this.scene.socket.off("playerShoot");
    }
  }
}
