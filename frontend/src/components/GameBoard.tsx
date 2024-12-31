import React, { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import Time from './Time';
import Card from '../Card';
import './GameBoard.css';

interface GameBoardProps {
  gameId: string;
  socket: Socket;
}

interface CardObject {
  rank: string;
  suit: string;
}

interface GameState {
  boards: CardObject[][]; // Array of arrays of cards (one for each board)
  flops: CardObject[][]; // Array of flops (3 cards each)
  turns: CardObject[]; // Array of turn cards (1 for each flop)
  rivers: CardObject[]; // Array of river cards (1 for each flop)
  status: string; // Game status
}

const GameBoard: React.FC<GameBoardProps> = ({ gameId, socket }) => {
  const [gameState, setGameState] = useState<GameState | null>(null);

  useEffect(() => {
    const handleGameState = (state: Omit<GameState, 'boards'>) => {
      // Construct boards dynamically by combining available flops, turns, and rivers
      const updatedBoards =
        state.flops?.map((flop, index) => {
          const board: CardObject[] = [...flop]; // Start with the flop cards

          // Add the turn card if it exists for this index
          if (state.turns[index]) {
            board.push(state.turns[index]);
          }

          // Add the river card if it exists for this index
          if (state.rivers[index]) {
            board.push(state.rivers[index]);
          }

          return board;
        }) || []; // Fallback to empty array if no flops are present

      // Update the state with the newly merged boards
      setGameState({
        ...state,
        boards: updatedBoards, // Merge flops, turns, and rivers into boards
      });
    };

    // Listen to the game state from the server
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
      <Time limit={4 * 60} />
      <h2>Game ID: {gameId}</h2>
      {gameState ? (
        <div>
          <h3>Game Status: {gameState.status}</h3>
          <div className="boards">
            {gameState.boards.map((board, index) => (
              <div key={index} className="board">
                {board.map((card, idx) => (
                  <Card key={idx} card={card} /> // Display each card
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
