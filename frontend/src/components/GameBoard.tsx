import React, { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import Time from './Time';
import Card from './Card';
import './GameBoard.css';

interface GameBoardProps {
  gameId: string;
  socket: Socket;
  playerId: string; // Unique ID of the current player
}

interface CardObject {
  rank: string;
  suit: string;
}

interface GameState {
  boards: CardObject[][]; // Cards on the boards
  flops: CardObject[][]; // Flops
  turns: CardObject[]; // Turn cards
  rivers: CardObject[]; // River cards
  status: string; // Game status
  playerCards: CardObject[]; // Player's private cards
  players: {
    id: string; // Player ID
    name: string; // Player name
    cards: CardObject[]; // Other Player's private cards if exposed
  }[];
}

const GameBoard: React.FC<GameBoardProps> = ({ gameId, socket, playerId }) => {
  const [gameState, setGameState] = useState<GameState | null>(null);

  useEffect(() => {
    const handleGameState = (state: Omit<GameState, 'boards'>) => {
      const updatedBoards =
        state.flops?.map((flop, index) => {
          const board: CardObject[] = [...flop];
          if (state.turns[index]) board.push(state.turns[index]);
          if (state.rivers[index]) board.push(state.rivers[index]);
          return board;
        }) || [];

      setGameState({
        ...state,
        boards: updatedBoards,
      });
    };

    socket.on('game-state', handleGameState);

    // Listen for the 'private-cards' event
    socket.on('private-cards', playerCards => {
      setGameState(prevState => ({
        ...prevState!,
        playerCards: playerCards,
      }));
    });

    return () => {
      socket.off('game-state', handleGameState);
      socket.off('private-cards');
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
                  <Card key={idx} card={card} />
                ))}
              </div>
            ))}
          </div>
          {/* Display player's private cards */}
          {gameState.playerCards && gameState.playerCards.length > 0 && (
            <div className="player-cards">
              <h3>Your Cards:</h3>
              <div className="cards-container">
                {gameState.playerCards.map((card, index) => (
                  <Card key={index} card={card} />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <button onClick={startGame}>Start Game</button>
      )}
    </div>
  );
};

export default GameBoard;
