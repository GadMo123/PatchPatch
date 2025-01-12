import React, { useEffect, useState } from 'react';
import './BetPanel.css';
import { BettingState } from '../gameTypes/GameState';

export type PlayerAction = 'fold' | 'check' | 'call' | 'bet' | 'raise';

interface BetPanelProps {
  bettingState: BettingState;
  onAction: (action: PlayerAction, amount?: number) => void;
  defaultAction: PlayerAction;
}

const BetPanel: React.FC<BetPanelProps> = ({
  bettingState,
  onAction,
  defaultAction,
}) => {
  const [timeLeft, setTimeLeft] = useState(bettingState.timeRemaining);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onAction(defaultAction); // todo : read action
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [defaultAction, onAction]);

  const handleRaise = () => {
    const amount = prompt('Enter your raise amount:'); // Example for a raise input
    if (amount && !isNaN(Number(amount))) {
      onAction('raise', Number(amount));
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
            <button onClick={() => onAction('check')} className="bet-button">
              Check
            </button>
          )}
          {hasBet && (
            <button onClick={() => onAction('bet')} className="bet-button">
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
          <button onClick={() => onAction('fold')} className="bet-button fold">
            Fold
          </button>
        )}
        {hasCall && (
          <button onClick={() => onAction('call')} className="bet-button call">
            Call
          </button>
        )}
        {hasRaise && (
          <button onClick={handleRaise} className="bet-button raise">
            Raise
          </button>
        )}
      </>
    );
  };

  return (
    <div className="bet-panel">
      <div className="timer">Time left: {timeLeft}s</div>
      {renderButtons()}
    </div>
  );
};

export default BetPanel;
