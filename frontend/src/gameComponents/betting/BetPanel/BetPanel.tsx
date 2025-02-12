import React, { useState } from "react";
import "./BetPanel.css";
import { useBettingActions } from "../../../hooks/SendPlayerActions";
import { useGameContext } from "../../../contexts/GameContext";
import socket from "../../../services/socket/Socket";
import { useCountdownTimer } from "../../../hooks/TimerHook";
import { BettingStateClientData, BettingTypes } from "@patchpatch/shared";

interface BetPanelProps {
  bettingState: BettingStateClientData;
  defaultAction: BettingTypes;
}

// Allows player to choose between betting options when its his turn to act, also show time-remaining to act before the defualt action is taken
const BetPanel: React.FC<BetPanelProps> = ({ bettingState, defaultAction }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { playerId, gameId } = useGameContext();
  const { sendAction } = useBettingActions(gameId, playerId, socket);

  const [timeLeft, cancelTimer] = useCountdownTimer({
    serverTimeRemaining: bettingState.timeRemaining,
    onComplete: () => onAction(defaultAction),
  });

  const onAction = async (action: BettingTypes, amount?: number) => {
    if (isProcessing) return;

    cancelTimer(); // Cancel timer when manual action is taken

    setIsProcessing(true);
    setError(null);
    try {
      const response = await sendAction(action, amount);
      if (!response.success) {
        setError(response.error || "Action failed");
      }
    } catch (err) {
      setError("Failed to send action");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBerOrRaise = (action: BettingTypes) => {
    const amount = prompt("Enter your raise amount:"); // Example for a raise input
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
      //Bet or check
      return (
        <>
          {hasCheck && (
            <button
              onClick={() => onAction(BettingTypes.CHECK)}
              className="bet-button check"
              disabled={isProcessing}
            >
              Check
            </button>
          )}
          {hasBet && (
            <button
              onClick={() => handleBerOrRaise(BettingTypes.BET)}
              className="bet-button bet"
              disabled={isProcessing}
            >
              Bet
            </button>
          )}
        </>
      );
    }

    return (
      // Facing a bet
      <>
        {hasFold && (
          <button
            onClick={() => onAction(BettingTypes.FOLD)}
            className="bet-button fold"
            disabled={isProcessing}
          >
            Fold
          </button>
        )}
        {hasCall && (
          <button
            onClick={() => onAction(BettingTypes.CALL)}
            className="bet-button call"
            disabled={isProcessing}
          >
            Call
          </button>
        )}
        {hasRaise && (
          <button
            onClick={() => handleBerOrRaise(BettingTypes.RAISE)}
            className="bet-button raise"
            disabled={isProcessing}
          >
            Raise
          </button>
        )}
      </>
    );
  };

  return (
    <div className="bet-panel">
      {<div className="timer">Time left: {timeLeft / 1000}s</div>}
      {error && <div className="error-message">{error}</div>}
      {renderButtons()}
    </div>
  );
};

export default BetPanel;
