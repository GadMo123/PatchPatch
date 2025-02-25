import React, { useState, useEffect } from "react";
import "./BuyInDialog.css";
import { useBuyInDialog } from "../../contexts/BuyInContext";
import { Slider } from "../../components/common/slider/Slider";

interface BuyInDialogProps {
  minBuyIn?: number;
  maxBuyIn?: number;
  bigBlind?: number;
  onBuyIn: (amount: number) => Promise<void>;
}

export const BuyInDialog: React.FC<BuyInDialogProps> = ({
  minBuyIn = 50,
  maxBuyIn = 500,
  bigBlind,
  onBuyIn,
}) => {
  const { isBuyInDialogOpen, closeBuyInDialog, buyInError } = useBuyInDialog();
  const [amount, setAmount] = useState(minBuyIn);
  const [isLoading, setIsLoading] = useState(false);

  // Reset amount when dialog opens or min/max values change
  useEffect(() => {
    if (isBuyInDialogOpen) {
      // Set initial amount to something in the middle range
      const initialAmount = Math.min(
        Math.max(minBuyIn, bigBlind ? bigBlind * 20 : minBuyIn),
        maxBuyIn
      );
      setAmount(initialAmount);
    }
  }, [isBuyInDialogOpen, minBuyIn, maxBuyIn, bigBlind]);

  // Generate ticks based on big blind increments
  const generateTicks = () => {
    if (!bigBlind || bigBlind <= 0) return undefined;

    // Create a set of ticks that explicitly includes min and max
    const ticks = [minBuyIn];

    // Number of intermediate ticks (excluding min and max)
    const intermediateTickCount = 12;
    const range = maxBuyIn - minBuyIn;
    const step = range / (intermediateTickCount + 1);

    for (let i = 1; i <= intermediateTickCount; i++) {
      // Round to the nearest big blind multiple
      const value = Math.round((minBuyIn + i * step) / bigBlind) * bigBlind;
      ticks.push(value);
    }

    // Explicitly add the max value
    ticks.push(maxBuyIn);

    return ticks;
  };

  const handleBuyIn = async () => {
    setIsLoading(true);
    try {
      await onBuyIn(amount);
      // Auto-close after successful buy-in
      closeBuyInDialog();
    } catch (error) {
      console.error(error);
      // If there's an error, don't close the dialog
      console.error("Buy-in failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Format currency with comma separators
  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString()}`;
  };

  if (!isBuyInDialogOpen) return null;

  return (
    <div
      className="buyin-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeBuyInDialog();
      }}
    >
      <div className="buyin-dialog">
        <h2 className="buyin-title">Buy In</h2>
        <div className="buyin-input-group">
          <label className="buyin-label">{formatCurrency(amount)}</label>
          <Slider
            min={minBuyIn}
            max={maxBuyIn}
            value={amount}
            onChange={setAmount}
            step={bigBlind}
            customTicks={generateTicks()}
            formatValue={() => ""} // Hide tick labels to match the image
            showInput={false}
          />
          <div className="buyin-limits">
            Min: {formatCurrency(minBuyIn)} - Max: {formatCurrency(maxBuyIn)}
          </div>
        </div>
        {buyInError && <div className="buyin-error">{buyInError}</div>}
        <div className="buyin-actions">
          <button
            onClick={closeBuyInDialog}
            className="buyin-button buyin-button-cancel"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleBuyIn}
            className="buyin-button buyin-button-confirm"
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : "Buy In"}
          </button>
        </div>
      </div>
    </div>
  );
};
