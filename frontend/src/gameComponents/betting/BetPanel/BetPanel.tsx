import React, { useEffect, useState, useRef } from "react";
import "./BetPanel.css";
import { useGameContext } from "../../../contexts/GameContext";
import { useCountdownTimer } from "../../../hooks/TimerHook";
import { BettingStateClientData, BettingTypes } from "@patchpatch/shared";
import { usePlayerAction } from "../../../hooks/CreateSocketAction";
import { useAnimationTheme } from "../../../contexts/AnimationThemeProvider";
import { Slider } from "../../../components/common/slider/Slider";

interface BetPanelProps {
  bettingState: BettingStateClientData;
  bigBlind: number; // Added bigBlind prop
}

// Allows player to choose between betting options when it's his turn to act, also shows time-remaining to act before the default action is taken
const BetPanel: React.FC<BetPanelProps> = ({ bettingState, bigBlind }) => {
  const { animationLevel } = useAnimationTheme();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [defaultAction, setDefaultAction] = useState<BettingTypes>(
    BettingTypes.CHECK
  );

  // States for the bet slider
  const [showBetSlider, setShowBetSlider] = useState(false);
  const [sliderAction, setSliderAction] = useState<BettingTypes | null>(null);
  const [betAmount, setBetAmount] = useState(0);
  const [isAllIn, setIsAllIn] = useState(false);
  const [activeButtonRef, setActiveButtonRef] = useState<HTMLElement | null>(
    null
  );
  const [isNearRightEdge, setIsNearRightEdge] = useState(false);

  const sliderRef = useRef<HTMLDivElement>(null);

  const { playerId, gameId } = useGameContext();
  const { sendAction } = usePlayerAction();

  const [timeLeft, cancelTimer] = useCountdownTimer({
    serverTimeRemaining: bettingState.timeRemaining,
    onComplete: () => onAction(defaultAction),
  });

  const onAction = async (action: BettingTypes, amount?: number) => {
    if (isProcessing) return;

    cancelTimer(); // Cancel timer when manual action is taken

    // Hide slider if it's open
    setShowBetSlider(false);

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

  // Handle click outside of the slider
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sliderRef.current &&
        !sliderRef.current.contains(event.target as Node) &&
        activeButtonRef !== event.target
      ) {
        setShowBetSlider(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeButtonRef]);

  // Initialize bet amount when slider is opened
  useEffect(() => {
    if (showBetSlider && bettingState) {
      // Check if player needs to go all-in due to small stack
      const minRaiseAmount = bettingState.minRaiseAmount;
      const allInAmount = bettingState.allInAmount;

      const isSmallStackAllIn =
        Math.abs(allInAmount - minRaiseAmount) < 0.01 ||
        allInAmount < minRaiseAmount;

      setIsAllIn(isSmallStackAllIn);

      if (isSmallStackAllIn) {
        // Player can only go all-in
        setBetAmount(allInAmount);
      } else {
        // Start with min raise amount
        setBetAmount(minRaiseAmount);
      }
    }
  }, [showBetSlider, bettingState]);

  // Check if button is near the right edge of the screen
  const checkRightEdgePosition = (button: HTMLElement) => {
    if (button) {
      const buttonRect = button.getBoundingClientRect();
      const viewportWidth = window.innerWidth;

      // Check if the right edge of the button is close to the right edge of the viewport
      // 160px is half the width of the slider container
      const isNearEdge = viewportWidth - buttonRect.right < 160;
      setIsNearRightEdge(isNearEdge);
    }
  };

  // Handle opening the slider for bet/raise
  const handleBetOrRaiseClick = (
    action: BettingTypes,
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    const button = event.currentTarget;
    setActiveButtonRef(button);

    // Check position relative to screen edges
    checkRightEdgePosition(button);

    const minRaiseAmount = bettingState.minRaiseAmount;
    const allInAmount = bettingState.allInAmount;

    // Check if player can only go all-in
    if (
      Math.abs(allInAmount - minRaiseAmount) < 0.01 ||
      allInAmount < minRaiseAmount
    ) {
      // Directly perform all-in action without showing slider
      onAction(action, allInAmount);
    } else {
      // Show slider for player to choose amount
      setSliderAction(action);
      setShowBetSlider(true);
    }
  };

  // Generate ticks for the slider
  const generateBetTicks = () => {
    const minRaiseAmount = bettingState.minRaiseAmount;
    const allInAmount = bettingState.allInAmount;

    // If player can only go all-in, return single tick
    if (
      Math.abs(allInAmount - minRaiseAmount) < 0.01 ||
      allInAmount < minRaiseAmount
    ) {
      return [allInAmount];
    }

    // Create ticks at multiples of big blind
    const ticks = [minRaiseAmount]; // Always include min raise

    // Create up to 14 ticks total
    const range = allInAmount - minRaiseAmount;
    const idealTickCount = Math.min(13, Math.floor(range / bigBlind)); // Max 13 more ticks (plus min)

    if (idealTickCount > 0) {
      const step = Math.max(
        bigBlind,
        Math.ceil(range / idealTickCount / bigBlind) * bigBlind
      );

      let currentTick = minRaiseAmount + step;
      while (currentTick < allInAmount - 0.01) {
        // Avoid floating point issues
        ticks.push(Math.floor(currentTick * 100) / 100); // Round to 2 decimal places
        currentTick += step;
      }
    }

    // Always include all-in amount as last tick
    if (Math.abs(ticks[ticks.length - 1] - allInAmount) > 0.01) {
      ticks.push(allInAmount);
    }

    return ticks;
  };

  // Format currency with comma separators
  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  const renderBetSlider = () => {
    if (!showBetSlider || !sliderAction) return null;

    const sliderTitle =
      sliderAction === BettingTypes.BET ? "Bet Amount" : "Raise To";

    return (
      <div
        className={`bet-slider-overlay ${isNearRightEdge ? "edge-right" : ""}`}
      >
        <div ref={sliderRef} className="bet-slider-container">
          <h3 className="bet-slider-title">{sliderTitle}</h3>

          {!isAllIn ? (
            <>
              <div className="bet-amount-display">
                {formatCurrency(betAmount)}
              </div>
              <Slider
                min={bettingState.minRaiseAmount}
                max={bettingState.allInAmount}
                value={betAmount}
                onChange={setBetAmount}
                step={bigBlind}
                customTicks={generateBetTicks()}
                formatValue={formatCurrency}
                showInput={false}
              />
            </>
          ) : (
            <div className="bet-amount-display all-in">
              {formatCurrency(bettingState.allInAmount)} (All-In)
            </div>
          )}

          <div className="bet-slider-actions">
            <button
              onClick={() => setShowBetSlider(false)}
              className="bet-slider-button cancel"
            >
              Cancel
            </button>
            <button
              onClick={() => onAction(sliderAction, betAmount)}
              className="bet-slider-button confirm"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    );
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

    // Check if all-in is the only option for bet/raise
    const minRaiseAmount = bettingState.minRaiseAmount;
    const allInAmount = bettingState.allInAmount;
    const isAllInOnly =
      Math.abs(allInAmount - minRaiseAmount) < 0.01 ||
      allInAmount < minRaiseAmount;

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
              onClick={(e) => handleBetOrRaiseClick(BettingTypes.BET, e)}
              className={`bet-button bet --${animationLevel}`}
              disabled={isProcessing}
            >
              {isAllInOnly
                ? `Bet ${formatCurrency(allInAmount)} (All-In)`
                : "Bet"}
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
            Call {formatCurrency(bettingState.callAmount)}
            {Math.abs(bettingState.callAmount - bettingState.allInAmount) < 0.01
              ? " (All-In)"
              : ""}
          </button>
        )}
        {hasRaise && (
          <button
            onClick={(e) => handleBetOrRaiseClick(BettingTypes.RAISE, e)}
            className={`bet-button raise --${animationLevel}`}
            disabled={isProcessing}
          >
            {isAllInOnly
              ? `Raise to ${formatCurrency(allInAmount)} (All-In)`
              : "Raise"}
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
      {showBetSlider && renderBetSlider()}
    </div>
  );
};

export default BetPanel;
