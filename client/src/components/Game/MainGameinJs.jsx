import React, { useState, useEffect, useRef, useCallback } from 'react';

const MainGameinJs = ({ gameState, user }) => {
  const [mapData, setMapData] = useState(null);
  const [tilesetImage, setTilesetImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  const selectedMap = gameState?.settings?.map || 'snow';

  // Cache player images to avoid reloading every render
  const playerImagesRef = useRef({});

  const loadMapData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load map JSON
      const mapResponse = await fetch(
        `/maps/${selectedMap}/${selectedMap}.json`,
      );
      if (!mapResponse.ok) {
        throw new Error(`Failed to load map: ${selectedMap}`);
      }
      const mapJson = await mapResponse.json();
      setMapData(mapJson);

      // Load tileset image
      const image = new Image();
      image.src = `/maps/${selectedMap}/${selectedMap}.png`;
      image.onload = () => {
        setTilesetImage(image);
        setLoading(false);
      };
      image.onerror = () => {
        throw new Error(`Failed to load tileset image for: ${selectedMap}`);
      };
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }, [selectedMap]);

  useEffect(() => {
    loadMapData();
  }, [loadMapData]);

  const renderTile = useCallback(
    (ctx, tileId, x, y, tileSize, scaleX, scaleY) => {
      if (!tilesetImage || tileId === 0) return;

      const tilesetColumns = 8; // adjust based on your tileset
      const tileIndex = tileId - 1;

      const sourceX = (tileIndex % tilesetColumns) * tileSize;
      const sourceY = Math.floor(tileIndex / tilesetColumns) * tileSize;

      ctx.drawImage(
        tilesetImage,
        sourceX,
        sourceY,
        tileSize,
        tileSize,
        x * tileSize * scaleX,
        y * tileSize * scaleY,
        tileSize * scaleX,
        tileSize * scaleY,
      );
    },
    [tilesetImage],
  );

  const renderPlayers = useCallback(
    (ctx, scaleX, scaleY) => {
      if (!gameState?.players || !user) return;

      // Separate current user from other players
      const currentUserPlayer = gameState.players.find(
        (player) => player.id === user.id,
      );
      const otherPlayers = gameState.players.filter(
        (player) => player.id !== user.id,
      );

      // Render other players first (in background)
      otherPlayers.forEach((player) => {
        renderPlayerSprite(ctx, player, scaleX, scaleY, false);
      });

      // Render current user on top (foreground)
      if (currentUserPlayer) {
        renderPlayerSprite(ctx, currentUserPlayer, scaleX, scaleY, true);
      }
    },
    [gameState, user, renderPlayerSprite],
  );

  const renderPlayerSprite = useCallback(
    (ctx, player, scaleX, scaleY, isCurrentUser) => {
      const { position, selectedPokemonDetails, name } = player;
      const { sprite } = selectedPokemonDetails;

      if (!sprite) return;

      // Load player sprite once
      if (!playerImagesRef.current[sprite]) {
        const img = new Image();
        img.src = sprite;
        playerImagesRef.current[sprite] = img;
      }

      const img = playerImagesRef.current[sprite];
      const drawImage = () => {
        const x = position.x * mapData.tilewidth * scaleX;
        const y = position.y * mapData.tileheight * scaleY;
        const width = mapData.tilewidth * scaleX;
        const height = mapData.tileheight * scaleY;

        // Draw the player sprite
        ctx.drawImage(img, x, y, width, height);

        // Add visual indicator for current user
        if (isCurrentUser) {
          // Add name tag with background for current user
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.fillRect(x - 10, y - 20, width + 20, 15);

          ctx.fillStyle = '#FFFFFF';
          ctx.font = '10px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(`${name} (You)`, x + width / 2, y - 8);
        } else {
          // Add name tag for other players
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.fillRect(x - 10, y - 20, width + 20, 15);

          ctx.fillStyle = '#FFFFFF';
          ctx.font = '10px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(name, x + width / 2, y - 8);
        }
      };

      if (img.complete) {
        drawImage();
      } else {
        img.onload = drawImage;
      }
    },
    [mapData],
  );

  const renderMap = useCallback(() => {
    if (!mapData || !tilesetImage || !containerRef.current || !user) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    const ctx = canvas.getContext('2d');

    // Canvas full size
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight + 300;

    // Background
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const scaleX = canvas.width / (mapData.width * mapData.tilewidth);
    const scaleY = canvas.height / (mapData.height * mapData.tileheight);

    // Draw tiles
    mapData.layers.forEach((layer) => {
      if (layer.visible && layer.type === 'tilelayer') {
        for (let y = 0; y < layer.height; y++) {
          for (let x = 0; x < layer.width; x++) {
            const tileIndex = y * layer.width + x;
            const tileId = layer.data[tileIndex];
            renderTile(ctx, tileId, x, y, mapData.tilewidth, scaleX, scaleY);
          }
        }
      }
    });

    // Draw players
    renderPlayers(ctx, scaleX, scaleY);
  }, [mapData, tilesetImage, user, renderTile, renderPlayers]);

  useEffect(() => {
    // renderMap itself checks required conditions (mapData, tilesetImage, user, refs)
    renderMap();
  }, [renderMap]);

  // Resize handler
  useEffect(() => {
    const handleResize = () => renderMap();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [renderMap]);

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600">
        <div className="text-2xl font-bold text-white animate-pulse mb-6">
          🗺️ Loading {selectedMap} Map...
        </div>
        <div className="w-20 h-20 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="text-white text-sm opacity-80">
          Map Size:{' '}
          {mapData ? `${mapData.width} × ${mapData.height}` : 'Loading...'}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-red-400 to-red-600 p-6">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-md text-center border border-white/20">
          <div className="text-3xl mb-4">⚠️</div>
          <div className="text-xl font-bold text-white mb-2">
            Map Loading Failed
          </div>
          <div className="text-white/90 mb-6">{error}</div>
          <button
            onClick={loadMapData}
            className="bg-white text-red-600 hover:bg-gray-100 px-6 py-3 rounded-lg transition-all font-semibold shadow-lg"
          >
            🔄 Retry Loading
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-xl text-gray-600">Please log in to play</div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
};

export default MainGameinJs;
