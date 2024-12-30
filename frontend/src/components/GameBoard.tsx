import React, { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import Time from './Time';
import Card from '../Card';

interface GameBoardProps {
  gameId: string;
  socket: Socket;
}

interface CardObject {
  rank: string;
  suit: string;
}

interface GameState {
  flops: CardObject[][]; // Array of arrays of strings
  status: string;    // Game status, e.g., 'waiting', 'started'
}

// Helper function to map server card strings to client card objects
const mapServerCardToClientCard = (card: string): CardObject => ({
  rank: card[0], // The first character is the rank
  suit: card[1], // The second character is the suit
});

const GameBoard: React.FC<GameBoardProps> = ({ gameId, socket }) => {
  const [gameState, setGameState] = useState<GameState | null>(null);

  useEffect(() => {
    const handleGameState = (state: { flops: CardObject[][]; status: string }) => {
      // Directly use the server response
      setGameState({ flops: state.flops, status: state.status });
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
      <Time limit={4 * 60}/>
      <h2>Game ID: {gameId}</h2>
      {gameState?.status === 'started' ? (
        <div>
          <h3>Game Started</h3>
          <div className="flops">
            {gameState.flops.map((flop, index) => (
              <div key={index} className="flop">
                {flop.map((card, idx) => (
                  <Card key={idx} card={card} /> // Use the Card component
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
