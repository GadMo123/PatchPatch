import React, { useState, useEffect } from 'react';
import './App.css';
import GameBoard from './components/GameBoard';
import Lobby from './components/Lobby';
import socket from './socket';

function App() {
  const [gameId, setGameId] = useState(null);
  const [isJoined, setIsJoined] = useState(false);

  useEffect(() => {
    console.log('App component mounted');
    socket.on('game-state', (gameState) => {
      console.log('Game state updated:', gameState);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const createGame = () => {
    console.log('Creating game...');
    socket.emit('create-game', (id) => {
      console.log('Game created with ID:', id);
      setGameId(id);
      setIsJoined(true);
    });
  };

  const joinGame = (id) => {
    console.log('Joining game with ID:', id);
    socket.emit('join-game', id, (gameState) => {
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
        <GameBoard gameId={gameId} socket={socket} />
      )}
    </div>
  );
}

export default App;
