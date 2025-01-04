import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import socket from '../socket/socket';
import './GameView.css';
import Time from '../utils/Time';
import Card from '../utils/Card';
import './GameView.css';

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

const GameView: React.FC<{ playerId: string }> = ({ playerId }) => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<GameState | null>(null);

  useEffect(() => {
    if (!gameId) {
      console.error('Game ID is missing');
      return;
    }

    const handleGameState = (state: Omit<GameState, 'boards'>) => {
      const updatedBoards =
        state.flops?.map((flop, index) => {
          const board: CardObject[] = [...flop];
          if (state.turns[index]) board.push(state.turns[index]);
          if (state.rivers[index]) board.push(state.rivers[index]);
          return board;
        }) || [];

      // Extract the current player's cards from the state
      const currentPlayer = state.players.find(
        player => player.id === playerId
      );

      setGameState({
        ...state,
        playerCards: currentPlayer?.cards || [],
        boards: updatedBoards,
      });
    };

    socket.on('game-state', handleGameState);

    // Clean up socket listeners on unmount
    return () => {
      socket.off('game-state', handleGameState);
    };
  }, [gameId]);

  const refreshGame = () => {
    if (!gameId) return;
    socket.emit('game-state', gameId, (response: any) => {
      if (response.success && response.gameState) {
        // This will be caught by the handleGameState listener in useEffect
        console.log('Game state refreshed:', response.gameState);
      } else {
        alert(response.message || 'Failed to refresh game state');
      }
    });
  };

  const leaveGame = () => {
    socket.emit('leave-game', gameId, () => {
      navigate('/lobby');
    });
  };

  return (
    <div className="GameView">
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
          <button onClick={leaveGame}>Leave Game</button>
        </div>
      ) : (
        <button onClick={refreshGame}>Start Game</button>
      )}
    </div>
  );
};

export default GameView;
