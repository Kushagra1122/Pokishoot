const fs = require('fs');
const path = require('path');

class MapManager {
  loadMapData(mapName) {
    try {
      const serverMapPath = path.join(__dirname, `../public/maps/${mapName}/${mapName}.json`);
      const clientMapPath = path.join(__dirname, `../../client/public/maps/${mapName}/${mapName}.json`);

      let mapPath = null;
      if (fs.existsSync(clientMapPath)) {
        mapPath = clientMapPath;
      } else if (fs.existsSync(serverMapPath)) {
        mapPath = serverMapPath;
      }

      if (mapPath) {
        const mapData = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
        return mapData;
      }
    } catch (error) {
      console.log(`⚠️ Could not load map data for ${mapName}, using fallback`);
    }

    return this.createFallbackMapData();
  }

  createFallbackMapData() {
    return {
      width: 20,
      height: 15,
      tilewidth: 32,
      tileheight: 32,
      layers: [
        {
          name: "Collision",
          type: "tilelayer",
          data: Array(20 * 15).fill(0)
        }
      ]
    };
  }

  findValidSpawnPositions(mapData, playerCount, existingPositions = [], strictCollision = false) {
    const positions = [];
    const maxAttempts = 500;
    let attempts = 0;

    console.log(`🎯 Finding ${playerCount} spawn positions on ${mapData.width}x${mapData.height} map`);
    if (existingPositions.length > 0) {
      console.log(`🚫 Avoiding ${existingPositions.length} existing player positions`);
    }

    // First, try to find positions randomly
    while (positions.length < playerCount && attempts < maxAttempts) {
      attempts++;
      
      const margin = 2;
      const candidatePos = {
        x: Math.floor(Math.random() * (mapData.width - margin * 2)) + margin,
        y: Math.floor(Math.random() * (mapData.height - margin * 2)) + margin
      };

      const allExistingPositions = [...existingPositions, ...positions];

      // Use strict collision checking for respawn
      const isValid = strictCollision ? 
        this.isPositionStrictlyValid(mapData, candidatePos, allExistingPositions) :
        this.isPositionValid(mapData, candidatePos, allExistingPositions);

      if (isValid && this.isAreaClear(mapData, candidatePos, 1)) {
        positions.push(candidatePos);
        console.log(`📍 Found valid spawn ${positions.length}/${playerCount} at tile (${candidatePos.x}, ${candidatePos.y})`);
      }
    }

    // If we couldn't find enough random positions, try systematic search
    if (positions.length < playerCount) {
      console.log(`⚠️ Random search found ${positions.length}/${playerCount}, trying systematic search...`);
      const allExistingPositions = [...existingPositions, ...positions];
      const systematicPositions = this.findPositionsSystematically(mapData, playerCount - positions.length, allExistingPositions, strictCollision);
      positions.push(...systematicPositions);
    }

    // Last resort: use safe fallback positions
    if (positions.length < playerCount) {
      console.log(`⚠️ Could only find ${positions.length} valid positions, using safe fallbacks`);
      const fallbackPositions = this.generateSafeFallbackPositions(mapData, playerCount - positions.length, existingPositions, strictCollision);
      positions.push(...fallbackPositions);
    }

    return positions.slice(0, playerCount);
  }

  // Enhanced collision detection that's more strict
  isPositionStrictlyValid(mapData, position, existingPositions) {
    // Basic boundary check
    if (position.x < 0 || position.x >= mapData.width || 
        position.y < 0 || position.y >= mapData.height) {
      return false;
    }

    // Enhanced collision layer checking
    let hasCollision = false;
    
    for (const layer of mapData.layers) {
      // Skip non-tile layers
      if (layer.type !== "tilelayer" || !layer.data) continue;
      
      // Check if this layer should be considered for collision
      const isCollisionLayer = layer.properties && layer.properties.some(p => 
        p.name === 'collision' && p.value === true
      ) || (layer.name && layer.name.toLowerCase().includes('collision'));

      if (isCollisionLayer) {
        const layerWidth = layer.width || mapData.width;
        const layerHeight = layer.height || mapData.height;

        if (position.x >= 0 && position.x < layerWidth && 
            position.y >= 0 && position.y < layerHeight) {
          
          const tileIndex = position.y * layerWidth + position.x;
          const tileId = layer.data[tileIndex];

          // If there's any non-zero tile, it's a collision
          if (tileId && tileId !== 0 && tileId !== -1) {
            console.log(`❌ Strict collision detected at (${position.x}, ${position.y}) in layer ${layer.name} - tile ID: ${tileId}`);
            hasCollision = true;
            break;
          }
        }
      }
    }

    if (hasCollision) {
      return false;
    }

    // Check minimum distance from other players
    const minDistance = 3;
    for (const existingPos of existingPositions) {
      const distance = Math.sqrt(
        Math.pow(existingPos.x - position.x, 2) + 
        Math.pow(existingPos.y - position.y, 2)
      );
      if (distance < minDistance) {
        console.log(`❌ Too close to existing player at (${position.x}, ${position.y}) - distance: ${distance.toFixed(2)}`);
        return false;
      }
    }

    console.log(`✅ Strictly valid position at (${position.x}, ${position.y})`);
    return true;
  }

  // Original collision detection (now uses strict internally)
  isPositionValid(mapData, position, existingPositions) {
    return this.isPositionStrictlyValid(mapData, position, existingPositions);
  }

  // Check if area around position is clear (no collision tiles in radius)
  isAreaClear(mapData, centerPos, radius) {
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        const checkPos = {
          x: centerPos.x + dx,
          y: centerPos.y + dy
        };

        // Only check for obstacles, not player proximity for area clearing
        if (!this.isPositionValidForObstacles(mapData, checkPos)) {
          return false;
        }
      }
    }
    return true;
  }

  // Check only for obstacles, not player proximity
  isPositionValidForObstacles(mapData, position) {
    // Basic boundary check
    if (position.x < 0 || position.x >= mapData.width || 
        position.y < 0 || position.y >= mapData.height) {
      return false;
    }

    // Check collision layers only
    for (const layer of mapData.layers) {
      // Skip non-tile layers
      if (layer.type !== "tilelayer" || !layer.data) continue;
      
      // Check if this layer should be considered for collision
      const isCollisionLayer = layer.properties && layer.properties.some(p => 
        p.name === 'collision' && p.value === true
      ) || (layer.name && layer.name.toLowerCase().includes('collision'));

      if (isCollisionLayer) {
        const layerWidth = layer.width || mapData.width;
        const layerHeight = layer.height || mapData.height;

        if (position.x >= 0 && position.x < layerWidth && 
            position.y >= 0 && position.y < layerHeight) {
          
          const tileIndex = position.y * layerWidth + position.x;
          const tileId = layer.data[tileIndex];

          // If there's any non-zero tile, it's a collision
          if (tileId && tileId !== 0 && tileId !== -1) {
            return false;
          }
        }
      }
    }

    return true;
  }

  // Systematic search through the map for valid positions
  findPositionsSystematically(mapData, neededCount, existingPositions, strictCollision = false) {
    const positions = [];
    const step = 2; // Reduced step for more thorough search
    
    for (let y = 2; y < mapData.height - 2 && positions.length < neededCount; y += step) {
      for (let x = 2; x < mapData.width - 2 && positions.length < neededCount; x += step) {
        const candidatePos = { x, y };
        
        const isValid = strictCollision ?
          this.isPositionStrictlyValid(mapData, candidatePos, [...existingPositions, ...positions]) :
          this.isPositionValid(mapData, candidatePos, [...existingPositions, ...positions]);
        
        if (isValid && this.isAreaClear(mapData, candidatePos, 1)) {
          positions.push(candidatePos);
          console.log(`📍 Systematic search found spawn at (${x}, ${y})`);
        }
      }
    }
    
    return positions;
  }

  // Generate safe fallback positions that avoid obvious collision areas
  generateSafeFallbackPositions(mapData, count, existingPositions = [], strictCollision = false) {
    const positions = [];
    const safeSpots = [
      // Try corners first (usually safe)
      { x: 2, y: 2 },
      { x: mapData.width - 3, y: 2 },
      { x: 2, y: mapData.height - 3 },
      { x: mapData.width - 3, y: mapData.height - 3 },
      // Try center areas
      { x: Math.floor(mapData.width / 2), y: Math.floor(mapData.height / 2) },
      { x: Math.floor(mapData.width / 4), y: Math.floor(mapData.height / 2) },
      { x: Math.floor(mapData.width * 3/4), y: Math.floor(mapData.height / 2) },
      { x: Math.floor(mapData.width / 2), y: Math.floor(mapData.height / 4) },
      { x: Math.floor(mapData.width / 2), y: Math.floor(mapData.height * 3/4) }
    ];

    // Test predefined safe spots with strict collision checking
    for (const spot of safeSpots) {
      if (positions.length >= count) break;
      
      if (spot.x >= 0 && spot.x < mapData.width && 
          spot.y >= 0 && spot.y < mapData.height) {
        
        // Check collision strictly for fallback positions
        const isValidPosition = strictCollision ?
          this.isPositionStrictlyValid(mapData, spot, [...existingPositions, ...positions]) :
          this.isPositionValid(mapData, spot, [...existingPositions, ...positions]);
        
        if (isValidPosition) {
          positions.push({ ...spot });
          console.log(`🆘 Valid fallback spawn at (${spot.x}, ${spot.y})`);
        }
      }
    }

    // If still need more, generate spiral pattern from center
    if (positions.length < count) {
      const centerX = Math.floor(mapData.width / 2);
      const centerY = Math.floor(mapData.height / 2);
      
      const spiralPositions = this.generateSpiralPositions(centerX, centerY, mapData, count - positions.length, existingPositions, strictCollision);
      positions.push(...spiralPositions);
    }

    return positions.slice(0, count);
  }

  generateSpiralPositions(centerX, centerY, mapData, count, existingPositions = [], strictCollision = false) {
    const positions = [];
    const directions = [
      { x: 0, y: -1 }, // up
      { x: 1, y: 0 },  // right
      { x: 0, y: 1 },  // down
      { x: -1, y: 0 }  // left
    ];
    
    let radius = 1;
    let directionIndex = 0;
    let currentPos = { x: centerX, y: centerY };

    // Add center position first if valid
    if (this.isPositionValid(mapData, currentPos, [...existingPositions, ...positions])) {
      positions.push({ x: centerX, y: centerY });
    }

    while (positions.length < count && radius < Math.max(mapData.width, mapData.height)) {
      for (let side = 0; side < 4 && positions.length < count; side++) {
        const stepsInThisSide = side % 2 === 0 ? radius : radius;
        
        for (let step = 0; step < stepsInThisSide && positions.length < count; step++) {
          currentPos = {
            x: currentPos.x + directions[directionIndex].x,
            y: currentPos.y + directions[directionIndex].y
          };

          // Check if position is valid
          const isValid = strictCollision ?
            this.isPositionStrictlyValid(mapData, currentPos, [...existingPositions, ...positions]) :
            this.isPositionValid(mapData, currentPos, [...existingPositions, ...positions]);

          if (isValid && 
              currentPos.x >= 1 && currentPos.x < mapData.width - 1 && 
              currentPos.y >= 1 && currentPos.y < mapData.height - 1) {
            positions.push({ ...currentPos });
            console.log(`🌀 Spiral fallback at (${currentPos.x}, ${currentPos.y})`);
          }
        }
        directionIndex = (directionIndex + 1) % 4;
      }
      radius++;
    }

    return positions.slice(0, count);
  }
}

module.exports = MapManager;