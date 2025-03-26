import React, { useEffect, useState, useRef, useCallback } from "react";
import "./BetPanel.css";
import { useGameContext } from "../../../contexts/GameContext";
import { useCountdownTimer } from "../../../hooks/TimerHook";
import { BettingStateClientData, BettingTypes } from "@patchpatch/shared";
import { usePlayerAction } from "../../../hooks/CreateSocketAction";
import { useAnimationTheme } from "../../../contexts/AnimationThemeProvider";
import { Slider } from "../../../components/common/slider/Slider";

interface BetPanelProps {
  bettingState: BettingStateClientData;
  bigBlind: number;
}

const BetPanel: React.FC<BetPanelProps> = ({ bettingState, bigBlind }) => {
  const { animationLevel } = useAnimationTheme();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [defaultAction, setDefaultAction] = useState<BettingTypes>(
    BettingTypes.CHECK
  );

  const [showBetSlider, setShowBetSlider] = useState(false);
  const [sliderAction, setSliderAction] = useState<BettingTypes | null>(null);
  const [betAmount, setBetAmount] = useState(0);
  const [isAllIn, setIsAllIn] = useState(false);
  const [activeButtonRef, setActiveButtonRef] = useState<HTMLElement | null>(
    null
  );

  const sliderRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const [dimensions, setDimensions] = useState({ width: 100, height: 40 });

  const { playerId, gameId } = useGameContext();
  const { sendAction } = usePlayerAction();

  const [initialTime] = useState(bettingState.timeRemaining);

  const [timeLeft, cancelTimer] = useCountdownTimer({
    serverTimeRemaining: bettingState.timeRemaining,
    onComplete: () => onAction(defaultAction),
  });

  const timePercentage = Math.max(0, (timeLeft / initialTime) * 100);

  // Update boarder color based on time left
  const getBorderColor = () => {
    const red = Math.min(255, 255 * (1 - timePercentage / 100));
    const green = Math.min(255, 255 * (timePercentage / 100));
    return `rgb(${red}, ${green}, 0)`;
  };

  // Dynamically get panel dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (panelRef.current) {
        const { width, height } = panelRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver(updateDimensions);
    if (panelRef.current) {
      resizeObserver.observe(panelRef.current);
    }

    return () => {
      if (panelRef.current) {
        resizeObserver.unobserve(panelRef.current);
      }
    };
  }, []);

  // Generate the SVG path based on panel dimensions
  const borderRadius = 8; // Matches CSS border-radius
  const { width, height } = dimensions;

  const borderPath = `
  M ${width / 2},2
  h ${width / 2 - borderRadius}
  a ${borderRadius},${borderRadius} 0 0 1 ${borderRadius},${borderRadius}
  v ${height - 2 * borderRadius - 4}
  a ${borderRadius},${borderRadius} 0 0 1 -${borderRadius},${borderRadius}
  h -${width - 2 * borderRadius}
  a ${borderRadius},${borderRadius} 0 0 1 -${borderRadius},-${borderRadius}
  v -${height - 2 * borderRadius - 4}
  a ${borderRadius},${borderRadius} 0 0 1 ${borderRadius},-${borderRadius}
  h ${width / 2 - borderRadius}
  z`;

  // Calculate path length dynamically
  const [pathLength, setPathLength] = useState(0);
  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength());
    }
  }, [dimensions]);

  const onAction = async (action: BettingTypes, amount?: number) => {
    if (isProcessing) return;

    cancelTimer();
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

  useEffect(() => {
    const newDefaultAction = bettingState.playerValidActions.includes(
      BettingTypes.CHECK
    )
      ? BettingTypes.CHECK
      : BettingTypes.FOLD;

    setDefaultAction(newDefaultAction);
  }, [bettingState.playerValidActions]);

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

  useEffect(() => {
    if (showBetSlider && bettingState) {
      const minRaiseAmount = bettingState.minRaiseAmount;
      const allInAmount = bettingState.allInAmount;

      const isSmallStackAllIn =
        Math.abs(allInAmount - minRaiseAmount) < 0.01 ||
        allInAmount < minRaiseAmount;

      setIsAllIn(isSmallStackAllIn);

      if (isSmallStackAllIn) {
        setBetAmount(allInAmount);
      } else {
        setBetAmount(
          minRaiseAmount +
            bettingState.activePlayerRoundPotContributions +
            bettingState.callAmount
        );
      }
    }
  }, [showBetSlider, bettingState]);

  const handleBetOrRaiseClick = (
    action: BettingTypes,
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    const button = event.currentTarget;
    setActiveButtonRef(button);

    const minRaiseAmountTotal =
      bettingState.minRaiseAmount +
      bettingState.activePlayerRoundPotContributions +
      bettingState.callAmount;
    const allInAmount = bettingState.allInAmount;

    if (
      Math.abs(allInAmount - minRaiseAmountTotal) < 0.01 ||
      allInAmount < minRaiseAmountTotal
    ) {
      onAction(action, allInAmount);
    } else {
      setSliderAction(action);
      setShowBetSlider(true);
    }
  };

  const generateBetTicks = () => {
    const minRaiseAmountTotal =
      bettingState.minRaiseAmount +
      bettingState.callAmount +
      bettingState.activePlayerRoundPotContributions;

    if (
      Math.abs(bettingState.allInAmount - minRaiseAmountTotal) < 0.01 ||
      bettingState.allInAmount < minRaiseAmountTotal
    ) {
      return [bettingState.allInAmount];
    }

    const ticks = [minRaiseAmountTotal];
    const range = bettingState.allInAmount - minRaiseAmountTotal;
    const idealTickCount = Math.min(13, Math.floor(range / bigBlind));

    if (idealTickCount > 0) {
      const step = Math.max(
        bigBlind,
        Math.ceil(range / idealTickCount / bigBlind) * bigBlind
      );

      let currentTick = minRaiseAmountTotal + step;
      while (currentTick < bettingState.allInAmount - 0.01) {
        ticks.push(Math.floor(currentTick * 100) / 100);
        currentTick += step;
      }
    }

    if (Math.abs(ticks[ticks.length - 1] - bettingState.allInAmount) > 0.01) {
      ticks.push(bettingState.allInAmount);
    }

    return ticks;
  };

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  const renderBetSlider = () => {
    if (!showBetSlider || !sliderAction) return null;

    const sliderTitle =
      sliderAction === BettingTypes.BET ? "Bet Amount" : "Raise To";

    return (
      <div
        className={`bet-slider-overlay`}
        style={{
          left: activeButtonRef
            ? `${activeButtonRef.getBoundingClientRect().left}px`
            : "auto",
          top: activeButtonRef
            ? `${activeButtonRef.getBoundingClientRect().top}px`
            : "auto",
        }}
      >
        <div ref={sliderRef} className="bet-slider-container">
          <h3 className="bet-slider-title">{sliderTitle}</h3>

          {!isAllIn ? (
            <>
              <div className="bet-amount-display">
                {formatCurrency(betAmount)}
              </div>
              <Slider
                min={
                  bettingState.minRaiseAmount +
                  bettingState.callAmount +
                  bettingState.activePlayerRoundPotContributions
                }
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

          {!isAllIn && (
            <div className="bet-slider-actions">
              <button
                onClick={() => setShowBetSlider(false)}
                className="bet-slider-button cancel"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  onAction(
                    sliderAction,
                    betAmount - bettingState.activePlayerRoundPotContributions
                  )
                }
                className="bet-slider-button confirm"
              >
                Confirm
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderButtons = () => {
    const { playerValidActions } = bettingState;

    const hasCheck = playerValidActions.includes(BettingTypes.CHECK);
    const hasBet = playerValidActions.includes(BettingTypes.BET);
    const hasFold = playerValidActions.includes(BettingTypes.FOLD);
    const hasCall = playerValidActions.includes(BettingTypes.CALL);
    const hasRaise = playerValidActions.includes(BettingTypes.RAISE);

    const minRaiseAmountTotal =
      bettingState.minRaiseAmount +
      bettingState.callAmount +
      bettingState.activePlayerRoundPotContributions;
    const isAllInOnly =
      Math.abs(bettingState.allInAmount - minRaiseAmountTotal) < 0.01 ||
      bettingState.allInAmount < minRaiseAmountTotal;

    if (hasCheck || hasBet) {
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
                ? `Bet ${formatCurrency(bettingState.allInAmount + bettingState.activePlayerRoundPotContributions)} (All-In)`
                : "Bet +"}
            </button>
          )}
        </>
      );
    }

    return (
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
            Call {formatCurrency(Math.min(bettingState.callAmount))}
            {!hasRaise ? " (All-In)" : ""}
          </button>
        )}
        {hasRaise && (
          <button
            onClick={(e) => handleBetOrRaiseClick(BettingTypes.RAISE, e)}
            className={`bet-button raise --${animationLevel}`}
            disabled={isProcessing}
          >
            {isAllInOnly
              ? `Raise to ${formatCurrency(Math.floor(bettingState.allInAmount + bettingState.activePlayerRoundPotContributions))} (All-In)`
              : "Raise +"}
          </button>
        )}
      </>
    );
  };

  return (
    <div className={`bet-panel-box --${animationLevel}`} ref={panelRef}>
      <div className="time-border">
        <svg
          className="time-border-svg"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
        >
          <path
            ref={pathRef}
            d={borderPath}
            fill="none"
            stroke={getBorderColor()}
            strokeWidth="2"
            style={{
              filter: `drop-shadow(0 0 5px ${getBorderColor()})`,
              transition: "stroke 0.1s linear",
            }}
          />
          <circle
            className="time-border-dot"
            style={{ fill: getBorderColor() }}
          >
            <animateMotion
              dur={`${initialTime / 1000}s`}
              begin="0s"
              repeatCount="1"
              fill="freeze"
            >
              <mpath href="#borderPath" />
            </animateMotion>
          </circle>
          <path id="borderPath" d={borderPath} fill="none" />
        </svg>
      </div>
      {error && <div className="error-message">{error}</div>}
      {renderButtons()}
      {showBetSlider && renderBetSlider()}
    </div>
  );
};

export default BetPanel;
