import React, { useEffect, useState } from 'react';
import './BetPanel.css';
import { BettingState } from '../types/GameState';
import { useBettingActions } from '../playerActions/SendPlayerActions';
import { useGameContext } from '../types/GameContext';
import socket from '../../../socket/Socket';
import { useCountdownTimer } from '../helpers/TimerHook';

export type PlayerAction = 'fold' | 'check' | 'call' | 'bet' | 'raise';

interface BetPanelProps {
  bettingState: BettingState;
  defaultAction: PlayerAction;
}

const BetPanel: React.FC<BetPanelProps> = ({ bettingState, defaultAction }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { playerId, gameId } = useGameContext();
  const { sendAction } = useBettingActions(gameId, playerId, socket);

  const [timeLeft, cancelTimer] = useCountdownTimer({
    serverTimeRemaining: bettingState.timeRemaining,
    onComplete: () => onAction(defaultAction),
  });

  const onAction = async (action: PlayerAction, amount?: number) => {
    if (isProcessing) return;
    cancelTimer(); // Cancel timer when manual action is taken
    setIsProcessing(true);
    setError(null);
    try {
      const response = await sendAction(action, amount);
      if (!response.success) {
        setError(response.error || 'Action failed');
      }
    } catch (err) {
      setError('Failed to send action');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBerOrRaise = (action: PlayerAction) => {
    const amount = prompt('Enter your raise amount:'); // Example for a raise input
    if (amount && !isNaN(Number(amount))) {
      onAction(action, Number(amount));
    }
  };

  const renderButtons = () => {
    const { playerValidActions } = bettingState;

    // Check if we have check/bet actions
    const hasCheck = playerValidActions.includes('check');
    const hasBet = playerValidActions.includes('bet');

    // Check if we have fold/call/raise actions
    const hasFold = playerValidActions.includes('fold');
    const hasCall = playerValidActions.includes('call');
    const hasRaise = playerValidActions.includes('raise');

    // Determine which set of buttons to show
    if (hasCheck || hasBet) {
      //Bet or check
      return (
        <>
          {hasCheck && (
            <button
              onClick={() => onAction('check')}
              className="bet-button check"
              disabled={isProcessing}
            >
              Check
            </button>
          )}
          {hasBet && (
            <button
              onClick={() => handleBerOrRaise('bet')}
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
            onClick={() => onAction('fold')}
            className="bet-button fold"
            disabled={isProcessing}
          >
            Fold
          </button>
        )}
        {hasCall && (
          <button
            onClick={() => onAction('call')}
            className="bet-button call"
            disabled={isProcessing}
          >
            Call
          </button>
        )}
        {hasRaise && (
          <button
            onClick={() => handleBerOrRaise('raise')}
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
