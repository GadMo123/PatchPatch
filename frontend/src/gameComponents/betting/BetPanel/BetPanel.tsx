import React, { useEffect, useState } from "react";
import "./BetPanel.css";
import { useGameContext } from "../../../contexts/GameContext";
import { useCountdownTimer } from "../../../hooks/TimerHook";
import { BettingStateClientData, BettingTypes } from "@patchpatch/shared";
import { usePlayerAction } from "../../../hooks/CreateSocketAction";
import { useAnimationTheme } from "../../../contexts/AnimationThemeProvider"; // Adjust path as needed

interface BetPanelProps {
  bettingState: BettingStateClientData;
}

// Allows player to choose between betting options when it's his turn to act, also shows time-remaining to act before the default action is taken
const BetPanel: React.FC<BetPanelProps> = ({ bettingState }) => {
  const { animationLevel } = useAnimationTheme();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [defaultAction, setDefaultAction] = useState<BettingTypes>(
    BettingTypes.CHECK
  );

  const { playerId, gameId } = useGameContext();
  const { sendAction } = usePlayerAction();

  const [timeLeft, cancelTimer] = useCountdownTimer({
    serverTimeRemaining: bettingState.timeRemaining,
    onComplete: () => onAction(defaultAction),
  });

  const onAction = async (action: BettingTypes, amount?: number) => {
    if (isProcessing) return;

    cancelTimer(); // Cancel timer when manual action is taken

    setIsProcessing(true);
    setError(null);
    const response = await sendAction({
      gameId: gameId,
      playerId: playerId,
      action: action,
      amount: amount,
    });
    if (!response.success) {
      console.log(response.message);
    }
    setIsProcessing(false);
  };

  // Update defaultAction whenever bettingState.playerValidActions changes
  useEffect(() => {
    const newDefaultAction = bettingState.playerValidActions.includes(
      BettingTypes.CHECK
    )
      ? BettingTypes.CHECK
      : BettingTypes.FOLD;

    setDefaultAction(newDefaultAction);
  }, [bettingState.playerValidActions]);

  const handleBetOrRaise = (action: BettingTypes) => {
    const amount = prompt("Enter your raise amount:");
    if (amount && !isNaN(Number(amount))) {
      onAction(action, Number(amount));
    }
  };

  const renderButtons = () => {
    const { playerValidActions } = bettingState;

    // Check if we have check/bet actions
    const hasCheck = playerValidActions.includes(BettingTypes.CHECK);
    const hasBet = playerValidActions.includes(BettingTypes.BET);

    // Check if we have fold/call/raise actions
    const hasFold = playerValidActions.includes(BettingTypes.FOLD);
    const hasCall = playerValidActions.includes(BettingTypes.CALL);
    const hasRaise = playerValidActions.includes(BettingTypes.RAISE);

    // Determine which set of buttons to show
    if (hasCheck || hasBet) {
      // Bet or check
      return (
        <>
          {hasCheck && (
            <button
              onClick={() => onAction(BettingTypes.CHECK)}
              className={`bet-button check --${animationLevel}`}
              disabled={isProcessing}
            >
              Check
            </button>
          )}
          {hasBet && (
            <button
              onClick={() => handleBetOrRaise(BettingTypes.BET)}
              className={`bet-button bet --${animationLevel}`}
              disabled={isProcessing}
            >
              Bet
            </button>
          )}
        </>
      );
    }

    return (
      // Facing a bet - fold, call, or raise
      <>
        {hasFold && (
          <button
            onClick={() => onAction(BettingTypes.FOLD)}
            className={`bet-button fold --${animationLevel}`}
            disabled={isProcessing}
          >
            Fold
          </button>
        )}
        {hasCall && (
          <button
            onClick={() => onAction(BettingTypes.CALL)}
            className={`bet-button call --${animationLevel}`}
            disabled={isProcessing}
          >
            Call
          </button>
        )}
        {hasRaise && (
          <button
            onClick={() => handleBetOrRaise(BettingTypes.RAISE)}
            className={`bet-button raise --${animationLevel}`}
            disabled={isProcessing}
          >
            Raise
          </button>
        )}
      </>
    );
  };

  return (
    <div className={`bet-panel --${animationLevel}`}>
      <div className={`timer --${animationLevel}`}>
        Time left: {timeLeft / 1000}s
      </div>
      {error && <div className="error-message">{error}</div>}
      {renderButtons()}
    </div>
  );
};

export default BetPanel;
