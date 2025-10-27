export default class MapManager {
  constructor(scene) {
    this.scene = scene;
    this.scaledMapWidth = 0;
    this.scaledMapHeight = 0;
  }

  preload() {
    const { selectedMap } = this.scene;
    
    try {
      console.log("Loading assets for map:", selectedMap);
      if (!selectedMap) {
        console.error("No selected map provided");
        return;
      }
      
      this.scene.load.tilemapTiledJSON("map", `/maps/${selectedMap}/${selectedMap}.json`);
      this.scene.load.image(`${selectedMap}-tileset`, `/maps/${selectedMap}/${selectedMap}.png`);
    } catch (error) {
      console.error("Error in map preload:", error);
    }
  }

  create() {
    try {
      // Check if map loaded successfully
      if (!this.scene.cache.tilemap.exists("map")) {
        throw new Error("Map failed to load from cache");
      }

      this.scene.map = this.scene.make.tilemap({ key: "map" });
      const tileset = this.scene.map.addTilesetImage(
        `${this.scene.selectedMap}-tileset`, 
        `${this.scene.selectedMap}-tileset`
      );
      
      if (!tileset) {
        console.error("Tileset not found");
        this.createFallbackMap();
        return;
      }

      this.calculateMapScale();
      this.createLayers(tileset);
      this.setupPhysicsBounds();

    } catch (error) {
      console.error("Error creating map:", error);
      this.createFallbackMap();
    }
  }

  calculateMapScale() {
    const width = this.scene.sys.game.config.width;
    const height = this.scene.sys.game.config.height;
    
    if (!this.scene.map) {
      console.error("No map available for scaling");
      return;
    }
    
    const mapWidth = this.scene.map.widthInPixels;
    const mapHeight = this.scene.map.heightInPixels;
    const padding = 20;
    
    const scaleX = (width - padding) / mapWidth;
    const scaleY = (height - padding) / mapHeight;
    
    this.scene.mapScale = Math.min(scaleX, scaleY) * 1.05;
    
    this.scaledMapWidth = mapWidth * this.scene.mapScale;
    this.scaledMapHeight = mapHeight * this.scene.mapScale;
    this.scene.mapOffsetX = (width - this.scaledMapWidth) / 2;
    this.scene.mapOffsetY = (height - this.scaledMapHeight) / 2;

    console.log(`Map: ${mapWidth}x${mapHeight}, Scale: ${this.scene.mapScale.toFixed(2)}`);
  }

  createLayers(tileset) {
    if (!this.scene.map || !this.scene.map.layers) {
      console.error("No map layers available");
      return;
    }

    this.scene.map.layers.forEach((layer, index) => {
      const tileLayer = this.scene.map.createLayer(layer.name, tileset, this.scene.mapOffsetX, this.scene.mapOffsetY);
      
      if (tileLayer) {
        tileLayer.setScale(this.scene.mapScale);
        tileLayer.setDepth(index);
        
        if (layer.properties) {
          const collisionProp = layer.properties.find(prop => 
            prop.name === "collision" && prop.value === true
          );
          if (collisionProp) {
            tileLayer.setCollisionByExclusion([-1]);
            console.log(`Layer ${layer.name} has collision enabled`);
          }
        }
      }
    });
  }

  setupPhysicsBounds() {
    if (!this.scene.physics.world) {
      console.error("Physics world not available");
      return;
    }

    this.scene.physics.world.setBounds(
      this.scene.mapOffsetX,
      this.scene.mapOffsetY,
      this.scaledMapWidth,
      this.scaledMapHeight
    );
  }

  createFallbackMap() {
    const width = this.scene.sys.game.config.width;
    const height = this.scene.sys.game.config.height;
    
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(0x2c3e50);
    graphics.fillRect(0, 0, width, height);
    
    graphics.fillStyle(0x34495e);
    for (let x = 0; x < width; x += 64) {
      for (let y = 0; y < height; y += 64) {
        graphics.fillRect(x, y, 32, 32);
      }
    }
    
    if (this.scene.physics.world) {
      this.scene.physics.world.setBounds(0, 0, width, height);
    }
    
    const text = this.scene.add.text(width / 2, height / 2, 'Map failed to load', {
      fontSize: '24px',
      fill: '#ffffff'
    }).setOrigin(0.5);
    
    console.log("Fallback map created");
  }

  getScaledMapWidth() {
    return this.scaledMapWidth;
  }

  getScaledMapHeight() {
    return this.scaledMapHeight;
  }

  getMapOffsetX() {
    return this.scene.mapOffsetX || 0;
  }

  getMapOffsetY() {
    return this.scene.mapOffsetY || 0;
  }

  getMapScale() {
    return this.scene.mapScale || 1;
  }
}