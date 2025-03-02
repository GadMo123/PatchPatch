import React, { useState, useEffect, useMemo, useCallback } from "react";
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
import { useGameStateUpdates } from "../../hooks/HandleServerBroadcastEvent";
import { useGameStateRequest } from "../../hooks/CreateSocketAction";
import TableAndSeats, {
  TableProps,
} from "../../gameComponents/tableAndSeats/TableAndSeats";
import { useBuyInDialog } from "../../contexts/BuyInContext";
import { BuyInDialog } from "../../gameComponents/buyInDialog/BuyInDialog";
import { useBuyIn } from "../../utils/BuyInHelpers";
import {
  CardLike,
  constructBoards,
  toCardArray,
} from "../../utils/GameHelpers";

// Memoized OpponentCards component
const MemoizedOpponentCards = React.memo(OpponentCards);
// Memoized BoardCards component
const MemoizedBoardCards = React.memo(BoardCards);
// Memoized PlayerCards component
const MemoizedPlayerCards = React.memo(PlayerCards);
// Memoized BetPanel component
const MemoizedBetPanel = React.memo(BetPanel);
// Memoized PotDisplay component
const MemoizedPotDisplay = React.memo(PotDisplay);
// Memoized TableAndSeats component
const MemoizedTableAndSeats = React.memo(TableAndSeats);

// Displaying the game screen when a player enter a game
const GameView: React.FC<{ playerId: string; gameId: string }> = ({
  playerId,
  gameId,
}) => {
  // const [boards, setBoards] = useState<Card[][] | null>(null);
  const [gameState, setGameState] = useState<GameStateServerBroadcast | null>(
    null
  );
  const [bettingState, setBettingState] =
    useState<BettingStateClientData | null>(null);
  const { sendAction: getGameState } = useGameStateRequest(); // Ask the server for current game-state on demand (non-standart usage, usfull for dc, lag ect.)

  const {
    canBuyIn,
    handleBuyIn,
    bigBlindAmount,
    minBuyIn,
    maxBuyIn,
    updateBuyInState,
  } = useBuyIn({
    gameId,
    playerId,
  });

  const { openBuyInDialog, setBuyInError } = useBuyInDialog();

  // Compute table props whenever gameState changes
  const tableProps: TableProps | null = useMemo(
    () => getTablePropsFromGameState(gameState, playerId),
    [gameState, playerId]
  );

  const boards = useMemo(() => {
    if (!gameState?.flops) return null;
    return constructBoards(gameState.flops, gameState.turns, gameState.rivers);
  }, [gameState?.flops, gameState?.turns, gameState?.rivers]);

  // Memoize opponent data
  const opponentData = useMemo(() => {
    if (!gameState?.publicPlayerDataMapByTablePosition) return null;
    return gameState.publicPlayerDataMapByTablePosition
      .filter((player) => player.id && player.id !== playerId)
      .map((player) => ({
        id: player.id!,
        name: player.name || "Villain",
        cards: player.cards || [],
        position: player.position!,
      }));
  }, [gameState?.publicPlayerDataMapByTablePosition, playerId]);

  // Memoize player cards
  const playerCards = useMemo(() => {
    return gameState?.privatePlayerData?.cards
      ? toCardArray(gameState.privatePlayerData.cards as CardLike[])
      : [];
  }, [gameState?.privatePlayerData?.cards]);

  // Memoize game phase arrange cards
  const gamePhaseArrangeCards = useMemo(() => {
    return gameState?.phase === "arrange-player-cards";
  }, [gameState?.phase]);

  // Memoize arrange cards time left
  const arrangeCardsTimeLeft = useMemo(() => {
    return gameState?.arrangePlayerCardsState?.timeRemaining ?? 0;
  }, [gameState?.arrangePlayerCardsState?.timeRemaining]);

  // Memoize pot size
  const potSize = useMemo(() => {
    return gameState?.potSize ?? 0;
  }, [gameState?.potSize]);

  // Memoize betting state props
  const bettingProps = useMemo(() => {
    if (
      !bettingState ||
      bettingState.playerToAct !== playerId ||
      bettingState.timeRemaining <= 0
    ) {
      return null;
    }
    return {
      bettingState,
    };
  }, [bettingState, playerId]);

  // Ask server to send last game-state as long as we don't have one (for reconnection / lag / ect.).
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

  // Recive game-state update from the server, Todo - many render optimizations are possible if needed
  useGameStateUpdates((state) => {
    if (state.id !== gameId) return; // Ignore updates for other games player is in (for multi-tabling)
    console.log(state);
    setGameState(state);
    if (
      state.bettingState &&
      JSON.stringify(bettingState) !== JSON.stringify(state.bettingState)
    ) {
      setBettingState(state.bettingState);
    }
    updateBuyInState(state);
  });

  const onBuyIn = async (amount: number) => {
    const result = await handleBuyIn(amount);
    if (result.success) {
      setBuyInError(undefined);
    } else {
      setBuyInError(result.message);
    }
  };

  return (
    <GameContextProvider playerId={playerId} gameId={gameId}>
      <div className="game-container">
        {canBuyIn && (
          <button onClick={openBuyInDialog} className="buyin-trigger">
            +
          </button>
        )}
        {tableProps && (
          <MemoizedTableAndSeats {...tableProps} canBuyIn={canBuyIn} />
        )}

        <div className="game-status">Game ID: {gameId}</div>
        <div className="opponent-area">
          {opponentData && <MemoizedOpponentCards opponents={opponentData} />}
        </div>
        <div className="boards-container">
          <div className="pot-display">
            {potSize > 0 && <MemoizedPotDisplay potSize={potSize} />}
          </div>
          {boards && <MemoizedBoardCards boards={boards} />}
        </div>
        <div className="player-area">
          <div className="player-cards">
            {playerCards.length > 0 && (
              <MemoizedPlayerCards
                playerCards={playerCards}
                gamePhaseArrangeCards={gamePhaseArrangeCards}
                arrangeCardsTimeLeft={arrangeCardsTimeLeft}
              />
            )}
          </div>
          {bettingProps && <MemoizedBetPanel {...bettingProps} />}
        </div>
        <BuyInDialog
          minBuyIn={minBuyIn}
          maxBuyIn={maxBuyIn}
          onBuyIn={onBuyIn}
          bigBlind={bigBlindAmount}
        />
      </div>
    </GameContextProvider>
  );
};

export default GameView;
