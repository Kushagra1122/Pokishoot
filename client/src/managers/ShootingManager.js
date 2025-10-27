import Phaser from 'phaser';

export default class ShootingManager {
  constructor(scene) {
    this.scene = scene;
    this.bullets = [];
    this.lastShootTime = 0;
    this.shootCooldown = 1000; // Default cooldown in ms
  }

  create() {
    // Setup click to shoot
    this.scene.input.on('pointerdown', (pointer) => {
      this.handleShoot(pointer);
    });

    console.log("✅ Shooting system initialized");
  }

  handleShoot(pointer) {
    const player = this.scene.players[this.scene.user?.id];
    if (!player || !player.container || player.health <= 0) {
      if (player && player.health <= 0) {
        console.log("💀 Cannot shoot while dead - waiting for respawn");
      }
      return;
    }

    const currentTime = Date.now();
    
    // Calculate shoot cooldown based on Pokemon's shootPerMin stat with ultra-smooth scaling
    const shootPerMin = player.selectedPokemonDetails?.baseStats?.shootPerMin || 60;
    // Ultra-smooth formula: much lower base cooldown for responsive gameplay
    this.shootCooldown = Math.max(50, (15 / shootPerMin) * 1000); // Minimum 50ms cooldown

    // Check cooldown
    if (currentTime - this.lastShootTime < this.shootCooldown) {
      console.log(`⏳ Shoot on cooldown (${this.shootCooldown}ms)`);
      return;
    }

    // Get shoot range
    const shootRange = (player.selectedPokemonDetails?.baseStats?.shootRange || 100) * 15;
    
    // Calculate target position (limited by range)
    const playerX = player.container.x;
    const playerY = player.container.y;
    const targetX = pointer.worldX;
    const targetY = pointer.worldY;
    
    const distance = Phaser.Math.Distance.Between(playerX, playerY, targetX, targetY);
    
    let finalTargetX = targetX;
    let finalTargetY = targetY;
    
    if (distance > shootRange) {
      const angle = Phaser.Math.Angle.Between(playerX, playerY, targetX, targetY);
      finalTargetX = playerX + Math.cos(angle) * shootRange;
      finalTargetY = playerY + Math.sin(angle) * shootRange;
    }

    // Create and fire bullet
    this.createBullet(playerX, playerY, finalTargetX, finalTargetY, player);
    this.lastShootTime = currentTime;

    // Emit shoot event to server
    if (this.scene.socket && this.scene.gameState) {
      this.scene.socket.emit("playerShoot", {
        gameCode: this.scene.gameState.code,
        playerId: this.scene.user.id,
        startX: playerX,
        startY: playerY,
        targetX: finalTargetX,
        targetY: finalTargetY,
        damage: player.selectedPokemonDetails?.baseStats?.hitPoint || 10
      });
    }
  }

  createBullet(startX, startY, targetX, targetY, player) {
    // Create bullet graphics
    const bullet = this.scene.add.graphics();
    bullet.fillStyle(0xff0000, 1);
    bullet.fillCircle(0, 0, 5);
    bullet.x = startX;
    bullet.y = startY;
    bullet.setDepth(100);

    // Calculate bullet velocity with ultra-fast speed
    const angle = Phaser.Math.Angle.Between(startX, startY, targetX, targetY);
    const bulletSpeed = 1200; // Ultra-fast bullet speed for maximum responsiveness
    
    const bulletData = {
      graphics: bullet,
      velocityX: Math.cos(angle) * bulletSpeed,
      velocityY: Math.sin(angle) * bulletSpeed,
      damage: player.selectedPokemonDetails?.baseStats?.hitPoint || 10,
      shooterId: this.scene.user.id,
      targetX: targetX,
      targetY: targetY,
      exactDistance: Phaser.Math.Distance.Between(startX, startY, targetX, targetY),
      traveledDistance: 0,
      startX: startX,
      startY: startY
    };

    this.bullets.push(bulletData);
  }

  handleRemoteShoot(data) {
    const { playerId, startX, startY, targetX, targetY } = data;
    
    // Don't create bullets for own shots (already created locally)
    if (playerId === this.scene.user?.id) return;

    const player = this.scene.players[playerId];
    if (!player) return;

    // Create bullet graphics for remote player
    const bullet = this.scene.add.graphics();
    bullet.fillStyle(0xff0000, 1);
    bullet.fillCircle(0, 0, 5);
    bullet.x = startX;
    bullet.y = startY;
    bullet.setDepth(100);

    // Calculate bullet velocity with ultra-fast speed
    const angle = Phaser.Math.Angle.Between(startX, startY, targetX, targetY);
    const bulletSpeed = 1200; // Match ultra-fast bullet speed for consistency
    
    const bulletData = {
      graphics: bullet,
      velocityX: Math.cos(angle) * bulletSpeed,
      velocityY: Math.sin(angle) * bulletSpeed,
      damage: data.damage || 10,
      shooterId: playerId,
      targetX: targetX,
      targetY: targetY,
      exactDistance: Phaser.Math.Distance.Between(startX, startY, targetX, targetY),
      traveledDistance: 0,
      startX: startX,
      startY: startY
    };

    this.bullets.push(bulletData);
  }

  update(time, delta) {
    // Update all bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      
      // Move bullet
      const deltaSeconds = delta / 1000;
      const moveX = bullet.velocityX * deltaSeconds;
      const moveY = bullet.velocityY * deltaSeconds;
      
      bullet.graphics.x += moveX;
      bullet.graphics.y += moveY;
      
      // Update traveled distance
      const distanceMoved = Math.sqrt(moveX * moveX + moveY * moveY);
      bullet.traveledDistance += distanceMoved;

      // Check if bullet has reached its target (crosshair position)
      const distanceToTarget = Phaser.Math.Distance.Between(
        bullet.graphics.x, 
        bullet.graphics.y, 
        bullet.targetX, 
        bullet.targetY
      );

      // Stop bullet if it has reached or passed the target position
      if (bullet.traveledDistance >= bullet.exactDistance || distanceToTarget < 10) {
        bullet.graphics.destroy();
        this.bullets.splice(i, 1);
        continue;
      }

      // Check collision with players along the path
      const hitPlayer = this.checkBulletCollision(bullet);
      if (hitPlayer) {
        // Only process hit if this is our bullet
        if (bullet.shooterId === this.scene.user?.id) {
          this.handleBulletHit(bullet, hitPlayer);
        }
        
        bullet.graphics.destroy();
        this.bullets.splice(i, 1);
      }
    }
  }

  checkBulletCollision(bullet) {
    const bulletX = bullet.graphics.x;
    const bulletY = bullet.graphics.y;

    for (const playerId in this.scene.players) {
      const player = this.scene.players[playerId];
      
      // Skip shooter and dead players
      if (playerId === bullet.shooterId || player.health <= 0) continue;
      
      if (!player.container || !player.container.body) continue;

      const playerX = player.container.x;
      const playerY = player.container.y;
      const distance = Phaser.Math.Distance.Between(bulletX, bulletY, playerX, playerY);

      // Check if bullet is within player hitbox (radius ~25 for better hit detection)
      if (distance < 25) {
        return playerId;
      }
    }

    return null;
  }

  handleBulletHit(bullet, targetPlayerId) {
    const targetPlayer = this.scene.players[targetPlayerId];
    if (!targetPlayer) return;

    // Calculate new health (ensure it doesn't go below 0)
    const oldHealth = targetPlayer.health;
    const newHealth = Math.max(0, oldHealth - bullet.damage);
    
    console.log(`💥 ${targetPlayer.name} hit for ${bullet.damage} damage! Health: ${oldHealth} → ${newHealth}`);

    // Update health locally immediately for responsive gameplay
    targetPlayer.health = newHealth;
    this.scene.playerManager.updatePlayerHealthBar(targetPlayerId, newHealth);

    // Check if player was killed
    if (newHealth <= 0 && oldHealth > 0) {
      console.log(`💀 ${targetPlayer.name} was eliminated!`);
      // You can add death animation or effects here
    }

    // Send health update to server for synchronization
    if (this.scene.socket && this.scene.gameState) {
      this.scene.socket.emit("playerHealthUpdate", {
        gameCode: this.scene.gameState.code,
        playerId: targetPlayerId,
        health: newHealth,
        shooterId: bullet.shooterId,
        damage: bullet.damage
      });
    }

    // Track this as a hit for the shooter
    const shooter = this.scene.players[bullet.shooterId];
    if (shooter && this.scene.user?.id === bullet.shooterId) {
      shooter.stats = shooter.stats || {};
      shooter.stats.shotsFired = (shooter.stats.shotsFired || 0) + 1;
      shooter.stats.shotsHit = (shooter.stats.shotsHit || 0) + 1;
    }
  }

  destroy() {
    // Clean up all bullets
    this.bullets.forEach(bullet => {
      if (bullet.graphics) bullet.graphics.destroy();
    });
    this.bullets = [];
  }
}
