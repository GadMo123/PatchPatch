import React, { useState, useEffect } from 'react';
import socket from '../socket/socket';
import './GameView.css';
import Time from './gameComponents/Time';
import OpponentCards from './gameComponents/OpponentCards';
import PlayerCards from './gameComponents/PlayerCards';
import BoardCards from './gameComponents/BoardCards';
import { constructBoards } from './helpers/gameHelpers';
import { ServerGameState, BettingState } from './gameTypes/GameState';
import CardObject from './gameTypes/CardObject';
import BetPanel from './gameComponents/BetPanel';

const GameView: React.FC<{ playerId: string; gameId: string }> = ({
  playerId,
  gameId,
}) => {
  const [boards, setBoards] = useState<CardObject[][] | null>(null);
  const [gameState, setGameState] = useState<ServerGameState | null>(null);
  const [bettingState, setBettingState] = useState<BettingState | null>(null);

  useEffect(() => {
    if (!gameId) {
      console.error('Game ID is missing');
      return;
    }
    console.log(playerId);
    const handleGameState = (state: ServerGameState) => {
      if (state.arrangeCardsTimeLeft == 0) console.log(state);
      setGameState(state);
      setBoards(constructBoards(state.flops, state.turns, state.rivers) || []);
      if (state.bettingState) setBettingState(state.bettingState);
    };

    socket.on('game-state', handleGameState);
    return () => {
      socket.off('game-state', handleGameState);
    };
  }, [gameId]);

  function getDisplayCards(): CardObject[] {
    return (
      gameState!.playerPrivateState!.arrangedCards ??
      gameState?.playerPrivateState.cards!
    );
  }

  return (
    <div className="game-container">
      <Time limit={4 * 60} />
      <div className="game-status">Game ID: {gameId}</div>
      <div className="opponent-area">
        {gameState?.publicPlayerDataMapByPosition && (
          <OpponentCards
            opponents={Object.values(gameState.publicPlayerDataMapByPosition)
              .filter(player => player.id !== playerId)
              .map(player => ({
                id: player.id,
                name: player.name,
                cards: player.cards || [],
                position: player.position,
              }))}
          />
        )}
      </div>
      <div className="boards-container">
        {boards && <BoardCards boards={boards} />}
      </div>
      <div className="player-area">
        <div className="player-cards">
          {gameState?.playerPrivateState?.cards && (
            <PlayerCards
              playerCards={getDisplayCards()}
              gamePhaseArrangeCards={gameState.phase === 'arrange-player-cards'}
              arrangeCardsTimeLeft={gameState.arrangeCardsTimeLeft ?? 0}
              onArrangementComplete={arrangement => {
                socket.emit('cards-arrangement-complete', {
                  gameId,
                  playerId,
                  arrangement,
                });
              }}
            />
          )}
        </div>
        {bettingState && bettingState.playerToAct === playerId && (
          <div className="bet-panel">
            <BetPanel
              gameId={gameId}
              playerId={playerId}
              bettingState={bettingState}
              defaultAction={
                bettingState.playerValidActions.includes('check')
                  ? 'check'
                  : 'fold'
              }
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default GameView;
