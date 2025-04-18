import React, { useState, useEffect, useMemo } from "react";
import "./GameView.css";
import PlayerCards from "../../gameComponents/playersCardArea/PlayerCards/PlayerCards";
import BoardCards from "../../gameComponents/board/BoardCards/BoardCards";
import BetPanel from "../../gameComponents/betting/BetPanel/BetPanel";
import { GameContextProvider } from "../../contexts/GameContext";
import { GameStateServerBroadcast } from "@patchpatch/shared";
import { getTablePropsFromGameState } from "../../utils/TableAndRotationHelper";
import { useGameStateUpdates } from "../../hooks/HandleServerBroadcastEvent";
import {
  useExitGame,
  useGameStateRequest,
  useSitOutNextHand,
} from "../../hooks/CreateSocketAction";
import TableAndSeats, {
  TableProps,
} from "../../gameComponents/tableAndSeats/TableAndSeats";
import { useBuyInDialog } from "../../contexts/BuyInContext";
import { BuyInDialog } from "../../gameComponents/buyInDialog/BuyInDialog";
import { useBuyIn, useIsStackLow } from "../../utils/BuyInHelpers";
import {
  CardLike,
  constructBoards,
  toCardArray,
} from "../../utils/GameHelpers";
import PotDisplay from "../../components/common/PotDisplay/PotDisplay";
import { useAnimationTheme } from "../../contexts/AnimationThemeProvider";
import SitOutControl from "../../components/actions/SitOutControl";
import LeaveGame from "../../components/actions/LeaveGame";

// Memoized BoardCards component
const MemoizedBoardCards = React.memo(BoardCards);
// Memoized PlayerCards component
const MemoizedPlayerCards = React.memo(PlayerCards);
// Memoized BetPanel component
const MemoizedBetPanel = React.memo(BetPanel);
// Memoized SitOutControl component
const MemoizedSitOutControl = React.memo(SitOutControl);

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
  const { sendAction: sitOut } = useSitOutNextHand();
  const { sendAction: leaveGame } = useExitGame();
  const [isInHand, setIsInHand] = useState(false);

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
      gameState?.noShowdown,
      gameState?.showdown,
      gameState?.bettingState?.playerToAct,
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

  const isStackLow = useIsStackLow(gameState, playerId);

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
    setIsInHand(
      state.phase !== "waiting" &&
        state.publicPlayerDataMapByTablePosition.some(
          (data) =>
            data.id === playerId &&
            data.position !== null &&
            data.position !== undefined &&
            data.isFolded === false
        )
    );
  });

  // Get the player's sitout timer from game state
  const sitoutTimer = useMemo(() => {
    if (!gameState || !gameState.publicPlayerDataMapByTablePosition)
      return null;

    for (const [_, playerData] of Object.entries(
      gameState.publicPlayerDataMapByTablePosition
    )) {
      if (playerData.id === playerId) {
        return playerData.sitoutTimer ?? null;
      }
    }
    return null;
  }, [gameState?.publicPlayerDataMapByTablePosition]);

  // Handle sit out/in actions
  const handleSitOutChange = async (sitout: boolean) => {
    await sitOut({ gameId, playerId, sitout });
  };

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
          <LeaveGame
            sitOutNextHand={() => {
              handleSitOutChange(true);
              const checkbox = document.querySelector(
                '.sitout-checkbox-label input[type="checkbox"]'
              );
              if (checkbox instanceof HTMLInputElement) {
                checkbox.checked = true;
              }
            }}
            isInHand={isInHand}
            exitGame={() => leaveGame({ gameId, playerId })}
          />
          <div className="settings">
            {canBuyIn && (
              <button
                onClick={openBuyInDialog}
                className={`buyin-trigger --${animationLevel} ${isStackLow ? "glow" : ""}`}
              >
                +
              </button>
            )}
            {/* Animation slider assumed to be injected from top-level app */}
          </div>
        </div>

        {tableProps && (
          <TableAndSeats {...tableProps} canBuyIn={canBuyIn}>
            <div className={`table-content-container --${animationLevel}`}>
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
            </div>
          </TableAndSeats>
        )}

        <div className={`player-area --${animationLevel}`}>
          <div className="player-controls-container">
            {/* SitOut control in the bottom left corner */}
            <div className="sitout-control-wrapper">
              <MemoizedSitOutControl
                sitoutTimer={sitoutTimer}
                onSitOut={handleSitOutChange}
                className={`--${animationLevel}`}
              />
            </div>
          </div>

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

        {minBuyIn !== undefined &&
          maxBuyIn !== undefined &&
          bigBlindAmount !== undefined && (
            <BuyInDialog
              minBuyIn={minBuyIn}
              maxBuyIn={maxBuyIn}
              onBuyIn={onBuyIn}
              bigBlind={bigBlindAmount}
            />
          )}
      </div>
    </GameContextProvider>
  );
};

export default GameView;
