import React, { useEffect, useState } from 'react';
import './BetPanel.css';

interface BetPanelProps {
  options: 'check-bet' | 'fold-call-raise';
  onAction: (action: string, amount?: number) => void;
  timeLimit: number; // Time limit in seconds
  defaultAction: string; // Default action when the timer expires
}

const BetPanel: React.FC<BetPanelProps> = ({
  options,
  onAction,
  timeLimit,
  defaultAction,
}) => {
  const [timeLeft, setTimeLeft] = useState(timeLimit);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onAction(defaultAction); // Trigger default action
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer); // Cleanup timer on unmount
  }, [defaultAction, onAction]);

  const handleRaise = () => {
    const amount = prompt('Enter your raise amount:'); // Example for a raise input
    if (amount && !isNaN(Number(amount))) {
      onAction('raise', Number(amount));
    }
  };

  return (
    <div className="bet-panel">
      <div className="timer">Time left: {timeLeft}s</div>
      {options === 'check-bet' ? (
        <>
          <button onClick={() => onAction('check')} className="bet-button">
            Check
          </button>
          <button onClick={() => onAction('bet')} className="bet-button">
            Bet
          </button>
        </>
      ) : (
        <>
          <button onClick={() => onAction('fold')} className="bet-button fold">
            Fold
          </button>
          <button onClick={() => onAction('call')} className="bet-button call">
            Call
          </button>
          <button onClick={handleRaise} className="bet-button raise">
            Raise
          </button>
        </>
      )}
    </div>
  );
};

export default BetPanel;
