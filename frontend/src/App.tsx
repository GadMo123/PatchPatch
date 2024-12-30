// src/App.tsx

import React, { useState, useEffect } from 'react';
import './App.css';
import GameBoard from './components/GameBoard';
import Lobby from './components/Lobby';
import socket from './socket';

const App: React.FC = () => {
  const [gameId, setGameId] = useState<string | null>(null);
  const [isJoined, setIsJoined] = useState<boolean>(false);

  useEffect(() => {
    console.log('App component mounted');
    
    const handleGameState = (gameState: any) => {
      console.log('Game state updated:', gameState);
    };

    socket.on('game-state', handleGameState);

    return () => {
      socket.off('game-state', handleGameState);
      socket.disconnect();
    };
  }, []);

  const createGame = () => {
    console.log('Creating game...');
    socket.emit('create-game', (id: string) => {
      console.log('Game created with ID:', id);
      setGameId(id);
      setIsJoined(true);
    });
  };

  const joinGame = (id: string) => {
    console.log('Joining game with ID:', id);
    socket.emit('join-game', id, (gameState: any) => {
      console.log('Joined game, game state:', gameState);
      setGameId(id);
      setIsJoined(true);
    });
  };

  return (
    <div className="App">
      {!isJoined ? (
        <Lobby createGame={createGame} joinGame={joinGame} />
      ) : (
        <GameBoard gameId={gameId!} socket={socket} />
      )}
    </div>
  );
};

export default App;
