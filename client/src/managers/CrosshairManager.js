import Phaser from 'phaser';

export default class CrosshairManager {
  constructor(scene) {
    this.scene = scene;
    this.crosshair = null;
    this.rangeCircle = null;
    this.aimLine = null;
    this.isVisible = false;
    this.currentRange = 100; // Default range
  }

  create() {
    // Create only crosshair graphics (no range circle or aim line)
    this.crosshair = this.scene.add.graphics();
    
    // Set high depth so crosshair appears on top
    this.crosshair.setDepth(1500);
    
    // Always visible for the player
    this.setVisible(true);
    
    // Setup mouse input
    this.setupMouseInput();
    
    console.log("✅ Crosshair system initialized - Always visible, follows user");
  }

  setupMouseInput() {
    // Enable pointer events
    this.scene.input.on('pointermove', (pointer) => {
      this.updateCrosshairPosition(pointer.worldX, pointer.worldY);
    });
  }

  updateCrosshairPosition(x, y) {
    // Get current player position
    const player = this.scene.players[this.scene.user?.id];
    if (!player) return;

    const playerX = player.container.x;
    const playerY = player.container.y;

    // Calculate distance from player to cursor
    const distance = Phaser.Math.Distance.Between(playerX, playerY, x, y);
    
    // Limit crosshair to shoot range
    let targetX = x;
    let targetY = y;
    
    if (distance > this.currentRange) {
      const angle = Phaser.Math.Angle.Between(playerX, playerY, x, y);
      targetX = playerX + Math.cos(angle) * this.currentRange;
      targetY = playerY + Math.sin(angle) * this.currentRange;
    }

    // Update only crosshair (no range circle or aim line)
    this.drawCrosshair(targetX, targetY);
  }

  drawCrosshair(x, y) {
    this.crosshair.clear();
    
    // Simple crosshair dot
    this.crosshair.fillStyle(0xff0000, 1);
    this.crosshair.fillCircle(x, y, 4); // Slightly larger dot for visibility
  }

  drawRangeCircle(playerX, playerY) {
    this.rangeCircle.clear();
    
    // Range circle style
    this.rangeCircle.lineStyle(2, 0x00ff00, 0.5);
    this.rangeCircle.strokeCircle(playerX, playerY, this.currentRange);
  }

  drawAimLine(playerX, playerY, targetX, targetY) {
    this.aimLine.clear();
    
    // Aim line style
    this.aimLine.lineStyle(2, 0xffff00, 0.6);
    this.aimLine.moveTo(playerX, playerY);
    this.aimLine.lineTo(targetX, targetY);
    this.aimLine.strokePath();
  }

  updateRange(newRange) {
    this.currentRange = newRange || 100;
    console.log(`🎯 Crosshair range updated: ${this.currentRange}`);
  }

  // Update crosshair position when player moves
  updatePlayerPosition() {
    const player = this.scene.players[this.scene.user?.id];
    if (!player) return;

    // Get current mouse position relative to camera
    const pointer = this.scene.input.activePointer;
    if (pointer) {
      this.updateCrosshairPosition(pointer.worldX, pointer.worldY);
    }
  }

  updateForPlayer(playerId) {
    const player = this.scene.players[playerId];
    if (!player || playerId !== this.scene.user?.id) return;

    // Get Pokemon shoot range
    const shootRange = player.selectedPokemonDetails?.baseStats?.shootRange;
    if (shootRange) {
      // Scale shoot range to pixels (15x multiplier)
      const rangeInPixels = shootRange * 15;
      this.updateRange(rangeInPixels);
    }
  }

  toggle() {
    this.setVisible(!this.isVisible);
    return this.isVisible;
  }

  setVisible(visible) {
    this.isVisible = visible;
    
    if (this.crosshair) this.crosshair.setVisible(visible);
    
    // Update range when showing
    if (visible && this.scene.user) {
      this.updateForPlayer(this.scene.user.id);
    }
    
    console.log(`🎯 Crosshair ${visible ? 'shown' : 'hidden'}`);
  }

  destroy() {
    if (this.crosshair) this.crosshair.destroy();
  }
}