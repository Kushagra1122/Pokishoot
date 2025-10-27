import Phaser from "phaser";
import PlayerManager from "../managers/PlayerManager";
import MapManager from "../managers/MapManager";
import InputManager from "../managers/InputManager";
import SocketManager from "../managers/SocketManager";
import CrosshairManager from "../managers/CrosshairManager";
import ShootingManager from "../managers/ShootingManager";

export default class MainScene extends Phaser.Scene {
  constructor(externalData = {}) {
    super("MainScene");
    
    // Initialize with external data
    this.gameState = externalData.gameState || null;
    this.user = externalData.user || null;
    this.socket = externalData.socket || null;
    this.selectedMap = externalData.selectedMap || "snow";
    
    // Core scene properties
    this.players = {};
    this.cursors = null;
    this.map = null;
    this.mapScale = 1;
    this.mapOffsetX = 0;
    this.mapOffsetY = 0;
    
    // Managers (will be initialized in preload/create)
    this.playerManager = null;
    this.mapManager = null;
    this.inputManager = null;
    this.socketManager = null;
    this.crosshairManager = null;
    this.shootingManager = null;
  }

  preload() {
    console.log("Preloading scene with map:", this.selectedMap);
    
    // Initialize managers
    this.playerManager = new PlayerManager(this);
    this.mapManager = new MapManager(this);
    this.inputManager = new InputManager(this);
    this.socketManager = new SocketManager(this);
    this.crosshairManager = new CrosshairManager(this);
    this.shootingManager = new ShootingManager(this);

    // Load assets
    this.mapManager.preload();
    this.playerManager.preload();
  }

  create() {
    console.log("Creating scene with external data:", {
      hasGameState: !!this.gameState,
      hasUser: !!this.user,
      hasSocket: !!this.socket,
      selectedMap: this.selectedMap
    });

    if (!this.validateExternalData()) {
      console.error("Scene creation failed due to missing external data");
      this.mapManager.createFallbackMap();
      return;
    }

    try {
      // Setup map first
      this.mapManager.create();
      
      // Setup players
      this.playerManager.create();
      
      // Setup input
      this.inputManager.create();
      
      // Setup shooting
      this.shootingManager.create();
      
      // Setup crosshair
      this.crosshairManager.create();
      
      // Setup socket listeners
      this.socketManager.create();

      // Setup camera
      this.setupCamera();

      console.log("Scene created successfully");

    } catch (error) {
      console.error("Error during scene creation:", error);
      this.mapManager.createFallbackMap();
    }
  }

  validateExternalData() {
    if (!this.gameState) {
      console.error("Missing gameState");
      return false;
    }
    if (!this.user) {
      console.error("Missing user");
      return false;
    }
    if (!this.socket) {
      console.error("Missing socket");
      return false;
    }
    if (!this.selectedMap) {
      console.error("Missing selectedMap");
      return false;
    }
    return true;
  }

  setupCamera() {
    const me = this.players[this.user.id];
    if (me && me.container) {
      this.cameras.main.startFollow(me.container, true, 0.1, 0.1);
      this.cameras.main.setBounds(
        this.mapOffsetX,
        this.mapOffsetY,
        this.mapManager.getScaledMapWidth(),
        this.mapManager.getScaledMapHeight()
      );
      console.log(`Camera following: ${me.name}`);
    } else {
      const centerX = this.mapOffsetX + this.mapManager.getScaledMapWidth() / 2;
      const centerY = this.mapOffsetY + this.mapManager.getScaledMapHeight() / 2;
      this.cameras.main.centerOn(centerX, centerY);
      console.log("Camera centered on map (no player to follow)");
    }
    this.cameras.main.setZoom(1);
  }

  update(time, delta) {
    // Only update input if we have valid data
    if (this.inputManager && this.user && this.players[this.user.id]) {
      this.inputManager.update(time, delta);
    }
    
    // Update shooting manager
    if (this.shootingManager) {
      this.shootingManager.update(time, delta);
    }
    
    // Update crosshair to follow player movement
    if (this.crosshairManager && this.user) {
      this.crosshairManager.updatePlayerPosition();
    }
  }

  // Public methods for managers to access scene properties
  getPlayers() {
    return this.players;
  }

  setPlayers(players) {
    this.players = players;
  }

  getMapData() {
    return {
      map: this.map,
      mapScale: this.mapScale,
      mapOffsetX: this.mapOffsetX,
      mapOffsetY: this.mapOffsetY
    };
  }

  setMapData(map, scale, offsetX, offsetY) {
    this.map = map;
    this.mapScale = scale;
    this.mapOffsetX = offsetX;
    this.mapOffsetY = offsetY;
  }
}