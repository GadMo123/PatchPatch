import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import socket from '../socket/socket';
import './GameView.css';
import Time from '../utils/Time';
import OpponentCards from './gameComponents/OpponentCards';
import PlayerCards from './gameComponents/PlayerCards';
import BoardCards from './gameComponents/BoardCards';
import { constructBoards } from './helpers/gameHelpers';
import BetPanel from './gameComponents/BetPanel';
import GameState from './gameTypes/GameState';

const GameView: React.FC<{ playerId: string }> = ({ playerId }) => {
  const { gameId } = useParams<{ gameId: string }>();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [betOptions, setBetOptions] = useState<
    'check-bet' | 'fold-call-raise' | null
  >(null);

  useEffect(() => {
    if (!gameId) {
      console.error('Game ID is missing');
      return;
    }
    const handleGameState = (state: Omit<GameState, 'boards'>) => {
      const updatedBoards =
        constructBoards(state.flops, state.turns, state.rivers) || [];
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
    return () => {
      socket.off('game-state', handleGameState);
    };
  }, [gameId]);

  return (
    <div className="game-container">
      <Time limit={4 * 60} />
      <div className="game-status">Game ID: {gameId}</div>
      <div className="opponent-area">
        {gameState?.players && (
          <OpponentCards
            opponents={gameState.players.filter(
              player => player.id !== playerId
            )}
          />
        )}
      </div>
      <div className="boards-container">
        {gameState?.boards && <BoardCards boards={gameState.boards} />}
      </div>
      <div className="player-cards">
        {gameState?.playerCards && (
          <PlayerCards playerCards={gameState.playerCards} />
        )}
      </div>
      {betOptions && (
        <div className="bet-panel">
          <BetPanel
            options={betOptions}
            onAction={(action, amount) => console.log(action, amount)}
            timeLimit={10}
            defaultAction="fold"
          />
        </div>
      )}

      {/* Example button to show the panel for testing */}
      <button onClick={() => setBetOptions('check-bet')}>Show Check/Bet</button>
      <button onClick={() => setBetOptions('fold-call-raise')}>
        Show Fold/Call/Raise
      </button>
    </div>
  );
};

export default GameView;
