// src/App.tsx

import React, { useState, useEffect } from 'react';
import './App.css';
import GameBoard from './components/GameBoard';
import Lobby from './components/Lobby';
import socket from './socket';

const App: React.FC = () => {
  const [gameId, setGameId] = useState<string | null>(null);
  const [isJoined, setIsJoined] = useState<boolean>(false);
  const [playerId, setPlayerId] = useState<string | null>(null);

  useEffect(() => {
    console.log('App component mounted');

    // Handle game state updates
    const handleGameState = (gameState: any) => {
      console.log('Game state updated:', gameState);
    };

    // Wait for socket connection before setting up event listeners
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
    });

    // Listen for player ID from the server
    socket.on('player-id', (id: string) => {
      console.log('Received player ID:', id);
      setPlayerId(id);
    });

    socket.on('game-state', handleGameState);

    //socket.on('private-cards', );

    return () => {
      socket.off('game-state', handleGameState);
      socket.off('connect');
    };
  }, []);

  const createGame = () => {
    console.log('Creating game...');
  };

  const joinGame = (id: string) => {
    setGameId(id);
    setIsJoined(true);
    console.log('Joining game with ID:', id);
    socket.emit('join-game', id, (response: any) => {
      if (!response || !response.success) {
        console.error(
          `Failed to join game: ${response?.error || 'Unknown error'}`
        );
        return;
      }
      console.log('Joined game, game state:', response);
    });
    socket.emit('start-game', id, (response: any) => {});
  };

  return (
    <div className="App">
      {!isJoined ? (
        <Lobby createGame={createGame} joinGame={joinGame} />
      ) : (
        playerId &&
        gameId && (
          <GameBoard gameId={gameId} socket={socket} playerId={playerId} />
        )
      )}
    </div>
  );
};

export default App;
