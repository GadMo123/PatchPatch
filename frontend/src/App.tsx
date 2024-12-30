// src/App.tsx

import React, { useState, useEffect } from 'react';
import './App.css';
import GameBoard from './components/GameBoard';
import Lobby from './components/Lobby';
import socket from './socket';
import {io} from 'socket.io-client';


const App: React.FC = () => {
  const [gameId, setGameId] = useState<string | null>(null);
  const [isJoined, setIsJoined] = useState<boolean>(false);

  const socket = io('http://localhost:5000', {
    transports: ['websocket'],
    withCredentials: true,
  });

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

    socket.on('game-state', handleGameState);

    return () => {
      socket.off('game-state', handleGameState);
      socket.off('connect');
    };
  }, []);

  const createGame = () => {
    console.log('Creating game...');
    if (!socket.connected) {
      console.log('Socket is not connected');
      socket.once('connect', () => {
        console.log('Socket connected, retrying create game');
        createGame(); // Retry creating the game once connected
      });
      return;
    }

    console.log('Creating game...');
    socket.emit('create-game', (id: string) => {
      console.log('Game created with ID:', id); // Should be logged
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
