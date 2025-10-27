export default class PlayerManager {
  constructor(scene) {
    this.scene = scene;
    this.playerTextures = new Map();
  }

  preload() {
    const { gameState } = this.scene;
    
    if (gameState?.players?.length) {
      gameState.players.forEach((player) => {
        const spriteKey = `player-${player.id}`;
        const spritePath = player.selectedPokemonDetails?.sprite;
        
        if (spritePath && !this.scene.textures.exists(spriteKey)) {
          this.scene.load.spritesheet(spriteKey, spritePath, {
            frameWidth: 64,
            frameHeight: 64,
            margin: 0,
            spacing: 0
          });
        }
      });
    }

    this.scene.load.on('filecomplete', (key) => {
      if (key.startsWith('player-')) {
        console.log(`✓ Loaded spritesheet: ${key}`);
        this.playerTextures.set(key, true);
        this.createPlayerAnimations(key);
      }
    });

    this.scene.load.on('loaderror', (file) => {
      console.warn(`Failed to load: ${file.key}, creating fallback`);
      this.createFallbackSprite(file.key);
    });
  }

  create() {
    const { gameState } = this.scene;
    
    if (gameState?.players?.length) {
      gameState.players.forEach((player) => {
        this.spawnPlayer(player);
      });
    }
  }

  createPlayerAnimations(spriteKey) {
    // Create animations for 4x4 spritesheet (16 frames)
    // Frame layout: Row 0=Down, Row 1=Left, Row 2=Right, Row 3=Up
    // Each row has 4 frames for walking animation
    
    // Down (front-facing) - frames 0-3
    this.scene.anims.create({
      key: `${spriteKey}-down-idle`,
      frames: [{ key: spriteKey, frame: 0 }],
      frameRate: 1,
      repeat: -1
    });
    
    this.scene.anims.create({
      key: `${spriteKey}-down-walk`,
      frames: this.scene.anims.generateFrameNumbers(spriteKey, { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1
    });

    // Left - frames 4-7
    this.scene.anims.create({
      key: `${spriteKey}-left-idle`,
      frames: [{ key: spriteKey, frame: 4 }],
      frameRate: 1,
      repeat: -1
    });
    
    this.scene.anims.create({
      key: `${spriteKey}-left-walk`,
      frames: this.scene.anims.generateFrameNumbers(spriteKey, { start: 4, end: 7 }),
      frameRate: 8,
      repeat: -1
    });

    // Right - frames 8-11
    this.scene.anims.create({
      key: `${spriteKey}-right-idle`,
      frames: [{ key: spriteKey, frame: 8 }],
      frameRate: 1,
      repeat: -1
    });
    
    this.scene.anims.create({
      key: `${spriteKey}-right-walk`,
      frames: this.scene.anims.generateFrameNumbers(spriteKey, { start: 8, end: 11 }),
      frameRate: 8,
      repeat: -1
    });

    // Up (back-facing) - frames 12-15
    this.scene.anims.create({
      key: `${spriteKey}-up-idle`,
      frames: [{ key: spriteKey, frame: 12 }],
      frameRate: 1,
      repeat: -1
    });
    
    this.scene.anims.create({
      key: `${spriteKey}-up-walk`,
      frames: this.scene.anims.generateFrameNumbers(spriteKey, { start: 12, end: 15 }),
      frameRate: 8,
      repeat: -1
    });

    console.log(`✓ Created animations for ${spriteKey}`);
  }

  createFallbackSprite(key) {
    if (this.scene.textures.exists(key)) return;
    
    const graphics = this.scene.make.graphics({ x: 0, y: 0 });
    graphics.fillStyle(0x3498db);
    graphics.fillCircle(16, 16, 16);
    graphics.lineStyle(2, 0xffffff);
    graphics.strokeCircle(16, 16, 16);
    graphics.generateTexture(key, 32, 32);
    graphics.destroy();
    
    this.playerTextures.set(key, true);
  }

  spawnPlayer(player) {
    try {
      const { id, position, name, isYou, health = 100, selectedPokemonDetails } = player;
      
      if (this.scene.players[id]) {
        console.log(`Player ${name} already spawned, skipping`);
        return;
      }

      const spriteKey = `player-${id}`;
      
      // Check if sprite exists, otherwise use fallback
      if (!this.scene.textures.exists(spriteKey)) {
        console.warn(`Sprite ${spriteKey} not found, creating fallback`);
        this.createFallbackSprite(spriteKey);
        
        // Create animations for fallback sprite
        if (!this.scene.anims.exists(`${spriteKey}-down-idle`)) {
          this.createPlayerAnimations(spriteKey);
        }
      }

      // Calculate position
      const { startX, startY } = this.calculatePlayerPosition(position);
      
      // Create player container
      const container = this.createPlayerContainer(startX, startY, spriteKey, name, isYou, health, id);
      
      // Setup physics and collision
      this.setupPlayerPhysics(container);
      
      // Store player reference with Pokemon details for speed calculation
      this.scene.players[id] = {
        container,
        sprite: container.list[0],
        nameText: container.list[3],
        healthBarBg: container.list[1],
        healthBarFill: container.list[2],
        spriteKey,
        name: name,
        displayName: isYou ? `${name} (You)` : name,
        health: health,
        selectedPokemonDetails: selectedPokemonDetails || {},
        direction: 'down',
        isMoving: false,
        isYou: isYou || false
      };

      console.log(`✓ Player spawned: ${name} with Pokemon speed: ${selectedPokemonDetails?.baseStats?.speed || 'default'}`);

      // Update crosshair range if this is the current user
      if (isYou && this.scene.crosshairManager) {
        this.scene.crosshairManager.updateForPlayer(id);
      }

    } catch (error) {
      console.error("Error spawning player:", error);
    }
  }

  calculatePlayerPosition(position) {
    const { map, mapScale = 1, mapOffsetX = 0, mapOffsetY = 0 } = this.scene;
    
    // If map isn't loaded yet, use fallback positions
    if (!map) {
      return { 
        startX: this.scene.sys.game.config.width / 2, 
        startY: this.scene.sys.game.config.height / 2 
      };
    }

    const tileSize = map.tileWidth;
    const tileX = position?.x || 0;
    const tileY = position?.y || 0;
    
    const mapPixelX = (tileX * tileSize) + (tileSize / 2);
    const mapPixelY = (tileY * tileSize) + (tileSize / 2);
    
    const startX = mapOffsetX + (mapPixelX * mapScale);
    const startY = mapOffsetY + (mapPixelY * mapScale);

    return { startX, startY };
  }

  createPlayerContainer(x, y, spriteKey, name, isYou, health, playerId) {
    const mapScale = this.scene.mapScale || 1;
    
    // Create sprite
    const sprite = this.scene.add.sprite(0, 0, spriteKey);
    const spriteScale = Math.max(0.3, mapScale * 0.4);
    sprite.setScale(spriteScale);
    sprite.setDepth(10);
    sprite.play(`${spriteKey}-down-idle`);
    
    // Create health bar elements
    const healthBarBg = this.scene.add.graphics();
    const healthBarFill = this.scene.add.graphics();
    
    // Create name text
    const fontSize = Math.max(10, Math.min(16, 14 * mapScale));
    const displayName = isYou ? `${name} (You)` : name;
    const nameText = this.scene.add.text(
      0, 
      -50 * spriteScale,
      displayName,
      {
        fontSize: `${fontSize}px`,
        fill: isYou ? "#00ff00" : "#ffffff",
        stroke: "#000000",
        strokeThickness: 3,
        fontFamily: "Arial"
      }
    );
    nameText.setOrigin(0.5);
    nameText.setDepth(12);

    // Create container
    const container = this.scene.add.container(x, y, [
      sprite, 
      healthBarBg, 
      healthBarFill, 
      nameText
    ]);
    container.setDepth(10);

    // Enable physics
    this.scene.physics.world.enable(container);
    const bodyWidth = 20;
    const bodyHeight = 25;
    container.body.setSize(bodyWidth, bodyHeight);
    container.body.setOffset(-bodyWidth/2, -bodyHeight/2);

    // Initialize player data
    this.scene.players[playerId] = {
      container,
      sprite,
      nameText,
      healthBarBg,
      healthBarFill,
      spriteKey,
      name: displayName,
      health,
      selectedPokemonDetails: this.getPlayerPokemonDetails(playerId),
      direction: 'down',
      isMoving: false
    };

    this.updatePlayerHealthBar(playerId, health);
    return container;
  }

  getPlayerPokemonDetails(playerId) {
    // Get Pokemon details from game state
    const { gameState } = this.scene;
    if (!gameState?.players) return {};
    
    const player = gameState.players.find(p => p.id === playerId);
    return player?.selectedPokemonDetails || {};
  }

  updatePlayerHealthBar(playerId, health) {
    const player = this.scene.players[playerId];
    if (!player) return;

    player.health = health;
    const healthBarWidth = 60;
    const healthBarHeight = 6;
    const spriteScale = player.sprite.scaleX;
    const y = -35 * spriteScale;

    // Clear previous drawings
    player.healthBarBg.clear();
    player.healthBarFill.clear();

    // Draw health bar background
    player.healthBarBg.fillStyle(0xff0000);
    player.healthBarBg.fillRect(-healthBarWidth / 2, y, healthBarWidth, healthBarHeight);

    // Draw health bar fill
    const percentage = Math.max(0, health) / 100;
    player.healthBarFill.fillStyle(0x00ff00);
    player.healthBarFill.fillRect(-healthBarWidth / 2, y, healthBarWidth * percentage, healthBarHeight);
  }

  setupPlayerPhysics(container) {
    // Set collision with world bounds
    container.body.setCollideWorldBounds(true);

    // Add collision with map layers if map exists
    if (this.scene.map && this.scene.map.layers) {
      this.scene.map.layers.forEach((layer) => {
        const tileLayer = this.scene.map.getLayer(layer.name);
        if (tileLayer && tileLayer.tilemapLayer) {
          if (layer.properties) {
            const collisionProp = layer.properties.find(prop => 
              prop.name === "collision" && prop.value === true
            );
            if (collisionProp) {
              this.scene.physics.add.collider(container, tileLayer.tilemapLayer);
            }
          }
        }
      });
    }
  }

  updatePlayerAnimation(playerId, direction, isMoving) {
    const player = this.scene.players[playerId];
    if (!player) return;

    player.direction = direction;
    player.isMoving = isMoving;

    const animationKey = `${player.spriteKey}-${direction}-${isMoving ? 'walk' : 'idle'}`;
    
    // Only change animation if it's different from current
    if (player.sprite.anims.currentAnim?.key !== animationKey) {
      player.sprite.play(animationKey);
    }
  }

  removePlayer(playerId) {
    if (this.scene.players[playerId]) {
      this.scene.players[playerId].container.destroy();
      delete this.scene.players[playerId];
    }
  }

  updatePlayerPosition(playerId, x, y) {
    const player = this.scene.players[playerId];
    if (player && playerId !== this.scene.user?.id) {
      // Calculate direction based on movement
      const deltaX = x - player.container.x;
      const deltaY = y - player.container.y;
      
      let direction = player.direction;
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        direction = deltaX > 0 ? 'right' : 'left';
      } else if (Math.abs(deltaY) > 2) {
        direction = deltaY > 0 ? 'down' : 'up';
      }
      
      // Update animation to walking
      this.updatePlayerAnimation(playerId, direction, true);
      
      // Smoothly move other players
      this.scene.tweens.add({
        targets: player.container,
        x: x,
        y: y,
        duration: 100,
        ease: 'Power2',
        onComplete: () => {
          // Set back to idle when movement finishes
          this.updatePlayerAnimation(playerId, direction, false);
        }
      });
    }
  }
}