import React, { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';

interface GameBoardProps {
  gameId: string;
  socket: Socket;
}

interface GameState {
  flops: string[][]; // Array of arrays of strings
  status: string;    // Game status, e.g., 'waiting', 'started'
}

const GameBoard: React.FC<GameBoardProps> = ({ gameId, socket }) => {
  const [gameState, setGameState] = useState<GameState | null>(null);

  useEffect(() => {
    const handleGameState = (state: GameState) => {
      setGameState(state);
    };

    socket.on('game-state', handleGameState);

    return () => {
      socket.off('game-state', handleGameState);
    };
  }, [socket]);

  const startGame = () => {
    socket.emit('start-game', gameId);
  };

  return (
    <div className="GameBoard">
      <h2>Game ID: {gameId}</h2>
      {gameState?.status === 'started' ? (
        <div>
          <h3>Game Started</h3>
          <div className="flops">
            {gameState.flops.map((flop, index) => (
              <div key={index} className="flop">
                {flop.map((card, idx) => (
                  <span key={idx}>{card}</span>
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <button onClick={startGame}>Start Game</button>
      )}
    </div>
  );
};

export default GameBoard;
