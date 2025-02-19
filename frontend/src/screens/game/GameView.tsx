import React, { useState, useEffect, useMemo } from "react";
import "./GameView.css";
import OpponentCards from "../../gameComponents/playersCardArea/OpponentCards/OpponentCards";
import PlayerCards from "../../gameComponents/playersCardArea/PlayerCards/PlayerCards";
import BoardCards from "../../gameComponents/board/BoardCards/BoardCards";
import BetPanel from "../../gameComponents/betting/BetPanel/BetPanel";
import { GameContextProvider } from "../../contexts/GameContext";
import PotDisplay from "../../gameComponents/board/PotDisplay/PotDisplay";

import {
  BettingStateClientData,
  BettingTypes,
  Card,
  GameStateServerBroadcast,
} from "@patchpatch/shared";
import { getTablePropsFromGameState } from "../../utils/TableAndRotationHelper";
import { constructBoards } from "../../utils/gameHelpers";
import { useGameStateUpdates } from "../../hooks/HandleServerBroadcastEvent";
import { useGameStateRequest } from "../../hooks/CreateSocketAction";
import TableAndSeats, {
  TableProps,
} from "../../gameComponents/tableAndSeats/TableAndSeats";

// Displaying the game screen when a player enter a game
const GameView: React.FC<{ playerId: string; gameId: string }> = ({
  playerId,
  gameId,
}) => {
  const [boards, setBoards] = useState<Card[][] | null>(null);
  const [gameState, setGameState] = useState<GameStateServerBroadcast | null>(
    null
  );
  const [bettingState, setBettingState] =
    useState<BettingStateClientData | null>(null);
  const { sendAction: getGameState } = useGameStateRequest(); // Force sending game-state on demand

  // useMemo to compute table props whenever gameState changes
  const tableProps: TableProps | null = useMemo(
    () => getTablePropsFromGameState(gameState, playerId),
    [gameState, playerId]
  );

  // Ask server to send last game-state as long as we don't have one (reconnection / other).
  useEffect(() => {
    if (gameState !== null) return; // Don't start polling if we already have the game state

    const interval = setInterval(async () => {
      const success = await getGameState({ gameId, playerId });
      if (success) {
        clearInterval(interval); // Stop polling once we get a valid response
      }
    }, 1000);

    return () => clearInterval(interval); // Cleanup when unmounting
  }, [gameState, getGameState, gameId, playerId]);

  // Recive game-state update from the server
  useGameStateUpdates((state) => {
    if (state.id !== gameId) return; // Ignore updates for other games player is in (for multi-tabling)
    console.log(state);
    setGameState(state);
    setBoards(constructBoards(state.flops, state.turns, state.rivers));
    if (state.bettingState) setBettingState(state.bettingState);
  });

  function getDisplayCards(): Card[] {
    return gameState?.privatePlayerData?.cards ?? [];
  }

  return (
    <GameContextProvider playerId={playerId} gameId={gameId}>
      <div className="game-container">
        {tableProps && <TableAndSeats {...tableProps} />}
        <div className="game-status">Game ID: {gameId}</div>
        <div className="opponent-area">
          {gameState?.publicPlayerDataMapByTablePosition && (
            <OpponentCards
              opponents={gameState.publicPlayerDataMapByTablePosition
                .filter((player) => player.id && player.id !== playerId)
                .map((player) => ({
                  id: player.id!,
                  name: player.name || "Villain",
                  cards: player.cards || [],
                  position: player.position!,
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
            {gameState?.privatePlayerData?.cards && (
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
                  bettingState.playerValidActions.includes(BettingTypes.CHECK)
                    ? BettingTypes.CHECK
                    : BettingTypes.FOLD
                }
              />
            )}
        </div>
      </div>
    </GameContextProvider>
  );
};

export default GameView;
