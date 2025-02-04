import React, { useState, useEffect } from "react";
import "./GameView.css";
import OpponentCards from "../../game/players/OpponentCards/OpponentCards";
import PlayerCards from "../../game/players/PlayerCards/PlayerCards";
import BoardCards from "../../game/board/BoardCards/BoardCards";
import { constructBoards } from "../../utils/gameHelpers";
import { ServerGameState, BettingState } from "../../types/GameState";
import BetPanel from "../../game/betting/BetPanel/BetPanel";
import { GameContextProvider } from "../../contexts/GameContext";
import socket from "../../services/socket/Socket";
import PotDisplay from "../../game/board/PotDisplay/PotDisplay";
import TableAndSeats from "../../game/TableAndSeats/TableAndSeats";
import { Card } from "@patchpatch/shared";

const GameView: React.FC<{ playerId: string; gameId: string }> = ({
  playerId,
  gameId,
}) => {
  const [boards, setBoards] = useState<Card[][] | null>(null);
  const [gameState, setGameState] = useState<ServerGameState | null>(null);
  const [bettingState, setBettingState] = useState<BettingState | null>(null);

  useEffect(() => {
    if (!gameId) {
      console.error("Game ID is missing");
      return;
    }
    console.log(playerId);
    const handleGameState = (state: ServerGameState) => {
      console.log(state);
      setGameState(state);
      setBoards(constructBoards(state.flops, state.turns, state.rivers) || []);
      if (state.bettingState) setBettingState(state.bettingState);
    };

    socket.on("game-state", handleGameState);
    return () => {
      socket.off("game-state", handleGameState);
    };
  }, [gameId]);

  function getDisplayCards(): Card[] {
    return (
      gameState!.playerPrivateState!.arrangedCards ??
      gameState?.playerPrivateState.cards!
    );
  }

  return (
    <GameContextProvider playerId={playerId} gameId={gameId}>
      <div className="game-container">
        <TableAndSeats isPlayerSeated={true} numberOfSeats={6} />
        <div className="game-status">Game ID: {gameId}</div>
        <div className="opponent-area">
          {gameState?.publicPlayerDataMapByPosition && (
            <OpponentCards
              opponents={Object.values(gameState.publicPlayerDataMapByPosition)
                .filter((player) => player.id !== playerId)
                .map((player) => ({
                  id: player.id,
                  name: player.name,
                  cards: player.cards || [],
                  position: player.position,
                }))}
            />
          )}
        </div>

        <div className="boards-container">
          <div className="pot-display">
            {gameState?.potSize && gameState?.potSize > 0 && (
              <PotDisplay potSize={gameState?.potSize || 0} />
            )}
          </div>
          {boards && <BoardCards boards={boards} />}
        </div>
        <div className="player-area">
          <div className="player-cards">
            {gameState?.playerPrivateState?.cards && (
              <PlayerCards
                playerCards={getDisplayCards()}
                gamePhaseArrangeCards={
                  gameState.phase === "arrange-player-cards"
                }
                arrangeCardsTimeLeft={
                  gameState?.arrangePlayerCardsState?.timeRemaining ?? 0
                }
              />
            )}
          </div>
          {bettingState &&
            bettingState.playerToAct === playerId &&
            bettingState.timeRemaining > 0 && (
              <BetPanel
                bettingState={bettingState}
                defaultAction={
                  bettingState.playerValidActions.includes("check")
                    ? "check"
                    : "fold"
                }
              />
            )}
        </div>
      </div>
    </GameContextProvider>
  );
};

export default GameView;
