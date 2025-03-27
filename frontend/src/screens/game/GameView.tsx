import React, { useState, useEffect, useMemo } from "react";
import "./GameView.css";
import PlayerCards from "../../gameComponents/playersCardArea/PlayerCards/PlayerCards";
import BoardCards from "../../gameComponents/board/BoardCards/BoardCards";
import BetPanel from "../../gameComponents/betting/BetPanel/BetPanel";
import { GameContextProvider } from "../../contexts/GameContext";
import { GameStateServerBroadcast } from "@patchpatch/shared";
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
import PotDisplay from "../../components/common/PotDisplay/PotDisplay";
import { useAnimationTheme } from "../../contexts/AnimationThemeProvider"; // Adjust path as needed

// Memoized BoardCards component
const MemoizedBoardCards = React.memo(BoardCards);
// Memoized PlayerCards component
const MemoizedPlayerCards = React.memo(PlayerCards);
// Memoized BetPanel component
const MemoizedBetPanel = React.memo(BetPanel);

// Displaying the game screen when a player enter a game
const GameView: React.FC<{ playerId: string; gameId: string }> = ({
  playerId,
  gameId,
}) => {
  const { animationLevel } = useAnimationTheme();
  const [gameState, setGameState] = useState<GameStateServerBroadcast | null>(
    null
  );
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
    [
      gameState?.publicPlayerDataMapByTablePosition,
      gameState?.publicPlayerDataMapByTablePosition,
      playerId,
    ]
  );

  const boards = useMemo(() => {
    if (!gameState?.flops) return null;
    return constructBoards(gameState.flops, gameState.turns, gameState.rivers);
  }, [gameState?.flops, gameState?.turns, gameState?.rivers]);

  // Memoize player cards
  const playerCards = useMemo(() => {
    return gameState?.privatePlayerData?.cards
      ? toCardArray(gameState.privatePlayerData.cards as CardLike[])
      : [];
  }, [gameState?.privatePlayerData?.cards]);

  // Force (request) server to send last game-state as long as we don't have one (for reconnection / joining mid-hand / ect.).
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
      <div className={`game-view --${animationLevel}`}>
        <div className="upper-row">
          <div className={`game-status --${animationLevel}`}>
            Game ID: {gameId}
          </div>
          <div className="settings">
            {canBuyIn && (
              <button
                onClick={openBuyInDialog}
                className={`buyin-trigger --${animationLevel}`}
              >
                +
              </button>
            )}
            {/* Animation slider assumed to be injected from top-level app */}
          </div>
        </div>

        {tableProps && (
          <TableAndSeats {...tableProps} canBuyIn={canBuyIn}>
            <div className={`boards-container --${animationLevel}`}>
              {boards && (
                <MemoizedBoardCards
                  boards={boards}
                  showdownState={gameState?.showdown}
                />
              )}
            </div>
            {gameState?.potSizes?.length ? (
              <div className={`pot-displays --${animationLevel}`}>
                {gameState.potSizes.map((potSize, index) => (
                  <PotDisplay key={index} potSize={potSize} />
                ))}
              </div>
            ) : null}
          </TableAndSeats>
        )}

        <div className={`player-area --${animationLevel}`}>
          <div className={`player-cards --${animationLevel}`}>
            {playerCards.length > 0 && (
              <MemoizedPlayerCards
                playerCards={playerCards}
                gamePhaseArrangeCards={!!gameState?.arrangePlayerCardsState}
                arrangeCardsTimeLeft={
                  gameState?.arrangePlayerCardsState?.timeRemaining ?? 0
                }
                showdownState={gameState?.showdown}
              />
            )}
          </div>
          {gameState?.bettingState?.playerToAct === playerId && (
            <div className="bet-panel">
              <MemoizedBetPanel
                bettingState={gameState.bettingState}
                initialTime={gameState.tableConfig.timePerAction}
                bigBlind={gameState.tableConfig.bigBlindAmount}
              />
            </div>
          )}
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
