import React, { useState } from "react";
import PotDisplay from "./components/common/PotDisplay/PotDisplay";

const DebugPotDisplay: React.FC = () => {
  const [potSize, setPotSize] = useState<number>(0);

  const handlePotSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10) || 0;
    setPotSize(value);
  };

  return (
    <div className="debug-pot-display-container">
      <h2>Debug Pot Display</h2>
      <div className="input-container">
        <label htmlFor="potSize">Enter Pot Size ($): </label>
        <input
          type="number"
          id="potSize"
          value={potSize}
          onChange={handlePotSizeChange}
          min="0"
          step="1"
          className="pot-size-input"
        />
      </div>
      <div className="pot-display-wrapper">
        <PotDisplay potSize={potSize} />
      </div>
      <div className="pot-display-wrapper">
        <PotDisplay potSize={potSize} isPlayerContribution={true} />
      </div>
    </div>
  );
};

export default DebugPotDisplay;
