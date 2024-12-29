// src/components/GameBoard.js

import React, { useState, useEffect } from 'react';

const GameBoard = ({ gameId, socket }) => {
  const [gameState, setGameState] = useState(null);

  useEffect(() => {
    socket.on('game-state', (state) => {
      setGameState(state);
    });

    return () => {
      socket.off('game-state');
    };
  }, [socket]);

  return (
    <div className="GameBoard">
      <h2>Game ID: {gameId}</h2>
      <div className="flops">
        {/* Render the 3 poker flops, for example */}
        {gameState?.flops.map((flop, index) => (
          <div key={index} className="flop">
            {flop.map((card, idx) => (
              <span key={idx}>{card}</span>
            ))}
          </div>
        ))}
      </div>
      {/* Add more UI components for private cards, turns, and player actions */}
    </div>
  );
};

export default GameBoard;
