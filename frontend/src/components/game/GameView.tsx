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
    id: string;
    name: string;
    cards: CardObject[];
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
      console.log(state);
      const updatedBoards =
        state.flops?.map((flop, index) => {
          const board: CardObject[] = [...flop];
          if (state.turns[index]) board.push(state.turns[index]);
          if (state.rivers[index]) board.push(state.rivers[index]);
          return board;
        }) || [];

      const currentPlayer = state.players.find(
        player => player.id === playerId
      );
      const opponents = state.players.filter(player => player.id !== playerId);

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

  // Helper function to render opponent cards
  const renderOpponentCards = () => {
    return gameState?.players
      .filter(opponent => opponent.id !== playerId) // Exclude the current player
      .map((opponent, opponentIndex) => (
        <div key={`opponent-${opponentIndex}`} className="opponent-section">
          <div className="player-name">{opponent.name || 'Villain'}</div>
          <div className="opponent-cards">
            {opponent.cards?.map((card, cardIndex) => (
              <Card
                key={`opponent-${opponentIndex}-card-${cardIndex}`}
                card={card}
                className="card"
              />
            )) ||
              // Show card backs if cards are not revealed
              Array(12)
                .fill(null)
                .map((_, i) => (
                  <div
                    key={`hidden-card-${i}`}
                    className="card card-back"
                    style={{ backgroundImage: 'url("/assets/cards/back.png")' }}
                  />
                ))}
          </div>
        </div>
      ));
  };

  // Helper function to render board cards
  const renderBoardCards = () => {
    return gameState?.boards.map((board, boardIndex) => (
      <div key={`board-${boardIndex}`} className="board-section">
        <div className="board-label">Board {boardIndex + 1}</div>
        <div className="board">
          {board.map((card, cardIndex) => (
            <Card
              key={`board-${boardIndex}-card-${cardIndex}`}
              card={card}
              className="card"
            />
          ))}
        </div>
      </div>
    ));
  };

  // Helper function to render player cards
  const renderPlayerCards = () => {
    return Array(3) // Create 3 rows
      .fill(null)
      .map((_, rowIndex) => {
        const startIndex = rowIndex * 4; // Calculate starting index for the row
        const cardsForRow = gameState?.playerCards.slice(
          startIndex,
          startIndex + 4
        ); // Get 4 cards for this row

        return (
          <div key={`player-row-${rowIndex}`} className="player-row">
            <div className="player-board-label">
              Your cards for Board {rowIndex + 1}
            </div>
            <div className="player-cards-row">
              {cardsForRow?.map((card, cardIndex) => (
                <Card
                  key={`player-board-${rowIndex}-card-${cardIndex}`}
                  card={card}
                  className="card"
                />
              ))}
            </div>
          </div>
        );
      });
  };

  return (
    <div className="game-container">
      <Time limit={4 * 60} />
      <div className="game-status">Game ID: {gameId}</div>

      <div className="opponent-area">{renderOpponentCards()}</div>

      <div className="boards-container">{renderBoardCards()}</div>

      <div className="player-cards">{renderPlayerCards()}</div>
    </div>
  );
};
export default GameView;
