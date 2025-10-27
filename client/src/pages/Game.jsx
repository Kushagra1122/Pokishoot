import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import AuthContext from '../context/AuthContext';

import ChatBox from '../components/Game/ChatBox';
import Leaderboard from '../components/Game/Leaderboard';
import Timer from '../components/Game/Timer';
import MainGame from '../components/Game/MainGame';
import GameOver from '../components/Game/GameOver';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

const Game = () => {
  const { code } = useParams();
  const { user } = useContext(AuthContext);
  
  const [socket, setSocket] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [messages, setMessages] = useState([]);
  const [timeLeft, setTimeLeft] = useState(null);
  const [showGameOver, setShowGameOver] = useState(false);

  useEffect(() => {
    const gameSocket = io(API_BASE, { transports: ['websocket', 'polling'] });
    setSocket(gameSocket);

    gameSocket.on('connect', () => {
      if (user && code) {
        gameSocket.emit('joinGame', { gameCode: code, playerId: user.id });
      }
    });

    // ---- GAME EVENTS ----
    gameSocket.on('gameStarted', (data) => {
      setGameState(data);
      if (data?.timeLeft) setTimeLeft(data.timeLeft);
    });

    gameSocket.on('gameState', (data) => {
      setGameState(data);
      if (data?.timeLeft) setTimeLeft(data.timeLeft);
    });

    gameSocket.on('gameTimer', ({ timeLeft }) => {
      setTimeLeft(timeLeft);
    });

    gameSocket.on('gameEnded', (result) => {
      setGameState((prev) => ({ ...prev, status: 'ended', result }));
      setShowGameOver(true);
    });

    gameSocket.on('gameError', (error) => {
      setMessages((prev) => [
        ...prev,
        { system: true, text: `❌ Error: ${error}` },
      ]);
    });

    // ---- CHAT EVENTS ----
    gameSocket.on('receiveGameMessage', (data) => {
      setMessages((prev) => [
        ...prev,
        { ...data, self: data.playerId === user?.id },
      ]);
    });

    return () => gameSocket.disconnect();
  }, [code, user]);


  const handlePlayAgain = () => {
    setShowGameOver(false);
    // Navigate to battle page to create/join new game
    window.location.href = '/battle';
  };

  const handleReturnHome = () => {
    setShowGameOver(false);
    window.location.href = '/dashboard';
  };

  return (
    <div className="relative min-h-screen bg-linear-to-br from-blue-900 via-purple-800 to-blue-900 text-yellow-400 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 z-20 shrink-0 bg-black/20 backdrop-blur-sm border-b border-yellow-400/30">
        <div className="flex items-center gap-4">
          <div className="text-xl md:text-2xl font-bold">PokéWars</div>
          <div className="text-sm md:text-base text-yellow-200">
            {gameState?.settings?.gameType === 'friendly'
              ? 'Friendly'
              : 'Ranked'}
          </div>
        </div>

        <div className="text-sm md:text-base text-yellow-300 font-bold">
          {user?.name}
        </div>
      </div>

      {/* Floating panels: Chat, Timer, Leaderboard */}
      <div className="absolute top-20 left-4 right-4 flex flex-wrap justify-between items-start gap-4 z-10">
        <ChatBox
          className="w-full md:w-1/3 max-h-[70vh] overflow-y-auto bg-black/20 p-3 rounded-lg shadow-md"
          messages={messages}
          setMessages={setMessages}
          socket={socket}
          user={user}
          gameCode={code}
        />
        <Timer
          className="text-2xl font-bold text-center bg-black/30 p-3 rounded-lg shadow-md"
          timeLeft={timeLeft}
        />
        <Leaderboard
          className="w-full md:w-1/4 max-h-[70vh] overflow-y-auto bg-black/20 p-3 rounded-lg shadow-md"
          gameState={gameState}
          user={user}
          socket={socket}
        />
      </div>

      {/* Main Game Area - Fixed to take remaining space */}
      <div className="flex-1 justify-center pt-28 px-4 pb-4 min-h-0">
        <div className=" h-full mx-20 border-2 border-yellow-400 rounded-lg bg-black/20">
          <MainGame gameState={gameState} user={user} socket={socket} />
        </div>
      </div>

      {/* Game Over Modal */}
      {showGameOver && (
        <GameOver
          gameState={gameState}
          user={user}
          onPlayAgain={handlePlayAgain}
          onReturnHome={handleReturnHome}
        />
      )}
    </div>
  );
};

export default Game;
