import React, { useState, useEffect } from "react";
import { formatTime } from "../../utils/TimeFormatter";

interface SitOutControlProps {
  sitoutTimer: number | null;
  onSitOut: (sitout: boolean) => void;
  className?: string;
}

const SitOutControl: React.FC<SitOutControlProps> = ({
  sitoutTimer,
  onSitOut,
  className = "",
}) => {
  const [timeLeft, setTimeLeft] = useState<number | null>(sitoutTimer);
  const [checked, setChecked] = useState(false);

  // Set up timer to count down when sitting out
  useEffect(() => {
    setTimeLeft(sitoutTimer);

    if (sitoutTimer === null) {
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1000) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sitoutTimer]);

  const handleSitOutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChecked(e.target.checked);
    onSitOut(e.target.checked);
  };

  const handleImBack = () => {
    onSitOut(false);
  };

  // Player is currently sitting out
  if (timeLeft !== null) {
    return (
      <div className={`sit-out-control sitting-out ${className}`}>
        <div className="sitout-timer">{formatTime(timeLeft)}</div>
        <button className="im-back-button" onClick={handleImBack}>
          I'm Back
        </button>
      </div>
    );
  }

  // Player is active
  return (
    <div className={`sit-out-control active ${className}`}>
      <label className="sitout-checkbox-label">
        <input
          type="checkbox"
          checked={checked}
          onChange={handleSitOutChange}
        />
        Sit out next hand
      </label>
    </div>
  );
};

export default SitOutControl;
