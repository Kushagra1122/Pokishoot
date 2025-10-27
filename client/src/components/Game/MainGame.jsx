import React, { useEffect, useRef } from "react";
import Phaser from "phaser";
import MainScene from "../../scenes/MainScene";

const MainGame = ({ gameState, user, socket }) => {
  const containerRef = useRef(null);
  const phaserGameRef = useRef(null);

  const selectedMap = gameState?.settings?.map || "snow";

  useEffect(() => {
    if (!user || !selectedMap || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Cleanup previous game instance
    if (phaserGameRef.current) {
      phaserGameRef.current.destroy(true);
      phaserGameRef.current = null;
    }

    // Create scene instance with external data
    const sceneInstance = new MainScene({ gameState, user, socket, selectedMap });

    const config = {
      type: Phaser.AUTO,
      width,
      height,
      parent: containerRef.current,
      backgroundColor: "#1a1a1a",
      physics: {
        default: "arcade",
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false
        }
      },
      scene: sceneInstance, // Pass the instance, not the class
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: width,
        height: height
      },
      render: {
        pixelArt: true,
        antialias: false
      }
    };

    phaserGameRef.current = new Phaser.Game(config);

    return () => {
      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true);
        phaserGameRef.current = null;
      }
    };
  }, [selectedMap, user, socket, gameState]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center"
      style={{ 
        minHeight: "830px",
        backgroundColor: "#1a1a1a"
      }}
    />
  );
};

export default MainGame;