import React, { useState } from "react";
import "./BuyInDialog.css";
import { useBuyInDialog } from "../../contexts/BuyInContext";

interface BuyInDialogProps {
  minBuyIn?: number;
  maxBuyIn?: number;
  onBuyIn: (amount: number) => Promise<void>;
}

export const BuyInDialog: React.FC<BuyInDialogProps> = ({
  minBuyIn = 0,
  maxBuyIn = 0,
  onBuyIn,
}) => {
  const { isBuyInDialogOpen, closeBuyInDialog, buyInError } = useBuyInDialog();
  const [amount, setAmount] = useState(minBuyIn);

  if (!isBuyInDialogOpen) return null;

  return (
    <div className="buyin-overlay">
      <div className="buyin-dialog">
        <h2 className="buyin-title">Buy In</h2>
        <div className="buyin-input-group">
          <label className="buyin-label">Amount:</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            min={minBuyIn}
            max={maxBuyIn}
            className="buyin-input"
          />
          <div className="buyin-limits">
            Min: ${minBuyIn} - Max: ${maxBuyIn}
          </div>
        </div>
        {buyInError && <div className="buyin-error">{buyInError}</div>}
        <div className="buyin-actions">
          <button
            onClick={closeBuyInDialog}
            className="buyin-button buyin-button-cancel"
          >
            Cancel
          </button>
          <button
            onClick={() => onBuyIn(amount)}
            className="buyin-button buyin-button-confirm"
          >
            Buy In
          </button>
        </div>
      </div>
    </div>
  );
};
