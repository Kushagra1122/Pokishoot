import Phaser from 'phaser';

export default class InputManager {
  constructor(scene) {
    this.scene = scene;
    this.cursors = null;
    this.lastEmitTime = 0;
    this.emitThrottle = 50;
    
    // Smooth movement physics
    this.velocityX = 0;
    this.velocityY = 0;
    this.acceleration = 20;
    this.deceleration = 15;
  }

  create() {
    this.cursors = this.scene.input.keyboard.createCursorKeys();
    
    // Add spacebar key for shooting
    this.spaceKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  update(time) {
    // Safety checks for movement
    if (!this.scene.user || !this.cursors) return;
    
    const me = this.scene.players[this.scene.user.id];
    if (!me || !me.container || !me.container.body) return;

    // Handle spacebar shooting
    if (this.spaceKey && Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.handleSpacebarShoot();
    }

    const maxSpeed = this.calculateSpeed();

    let moving = false;
    let direction = me.direction;
    let targetVelocityX = 0;
    let targetVelocityY = 0;

    // Calculate target velocity based on input
    if (this.cursors.left.isDown) {
      targetVelocityX = -maxSpeed;
      direction = 'left';
      moving = true;
    } else if (this.cursors.right.isDown) {
      targetVelocityX = maxSpeed;
      direction = 'right';
      moving = true;
    }

    if (this.cursors.up.isDown) {
      targetVelocityY = -maxSpeed;
      direction = 'up';
      moving = true;
    } else if (this.cursors.down.isDown) {
      targetVelocityY = maxSpeed;
      direction = 'down';
      moving = true;
    }

    // Normalize diagonal movement to maintain consistent speed
    if (targetVelocityX !== 0 && targetVelocityY !== 0) {
      const diagonalFactor = Math.SQRT1_2;
      targetVelocityX *= diagonalFactor;
      targetVelocityY *= diagonalFactor;
    }

    // Smooth acceleration/deceleration
    if (targetVelocityX !== this.velocityX) {
      if (targetVelocityX === 0) {
        // Decelerate
        if (this.velocityX > 0) {
          this.velocityX = Math.max(0, this.velocityX - this.deceleration);
        } else {
          this.velocityX = Math.min(0, this.velocityX + this.deceleration);
        }
      } else {
        // Accelerate toward target
        if (this.velocityX < targetVelocityX) {
          this.velocityX = Math.min(targetVelocityX, this.velocityX + this.acceleration);
        } else {
          this.velocityX = Math.max(targetVelocityX, this.velocityX - this.acceleration);
        }
      }
    }

    if (targetVelocityY !== this.velocityY) {
      if (targetVelocityY === 0) {
        // Decelerate
        if (this.velocityY > 0) {
          this.velocityY = Math.max(0, this.velocityY - this.deceleration);
        } else {
          this.velocityY = Math.min(0, this.velocityY + this.deceleration);
        }
      } else {
        // Accelerate toward target
        if (this.velocityY < targetVelocityY) {
          this.velocityY = Math.min(targetVelocityY, this.velocityY + this.acceleration);
        } else {
          this.velocityY = Math.max(targetVelocityY, this.velocityY - this.acceleration);
        }
      }
    }

    // Set the smoothed velocities
    me.container.body.setVelocity(this.velocityX, this.velocityY);

    // Update animation based on movement and direction
    if (direction !== me.direction || moving !== me.isMoving) {
      this.scene.playerManager.updatePlayerAnimation(this.scene.user.id, direction, moving);
    }

    if (moving && this.scene.socket && time - this.lastEmitTime > this.emitThrottle) {
      this.lastEmitTime = time;
      this.emitPlayerMovement(me);
    }
  }

  calculateSpeed() {
    const me = this.scene.players[this.scene.user?.id];
    if (!me) return 100; // Fallback speed
    
    const pokemonSpeed = me.selectedPokemonDetails?.baseStats?.speed;
    
    // Use the exact Pokemon speed stat from baseStats
    if (pokemonSpeed && typeof pokemonSpeed === 'number') {
      return pokemonSpeed;
    }
    
    // Fallback if no Pokemon stats
    return 100;
  }

  emitPlayerMovement(player) {
    if (!this.scene.gameState) return;
    
    this.scene.socket.emit("playerMove", {
      gameCode: this.scene.gameState.code,
      playerId: this.scene.user.id,
      x: player.container.x,
      y: player.container.y
    });
  }

  handleSpacebarShoot() {
    // Check if shooting manager exists and player is valid
    if (!this.scene.shootingManager || !this.scene.user) return;
    
    const player = this.scene.players[this.scene.user.id];
    if (!player || !player.container || player.health <= 0) return;

    // Get crosshair position from CrosshairManager
    const crosshairManager = this.scene.crosshairManager;
    if (!crosshairManager || !crosshairManager.crosshair) return;

    // Get current mouse position to determine crosshair target
    const pointer = this.scene.input.activePointer;
    if (!pointer) return;

    const playerX = player.container.x;
    const playerY = player.container.y;
    
    // Calculate crosshair position based on current mouse position and range
    const mouseX = pointer.worldX;
    const mouseY = pointer.worldY;
    const distance = Phaser.Math.Distance.Between(playerX, playerY, mouseX, mouseY);
    
    let targetX = mouseX;
    let targetY = mouseY;
    
    // Limit to current crosshair range
    if (distance > crosshairManager.currentRange) {
      const angle = Phaser.Math.Angle.Between(playerX, playerY, mouseX, mouseY);
      targetX = playerX + Math.cos(angle) * crosshairManager.currentRange;
      targetY = playerY + Math.sin(angle) * crosshairManager.currentRange;
    }

    // Create a mock pointer object for the shooting manager
    const mockPointer = {
      worldX: targetX,
      worldY: targetY
    };

    // Use the existing shooting manager's handleShoot method
    this.scene.shootingManager.handleShoot(mockPointer);
  }
}