import React from "react";
import "./PotDisplay.css";

const CHIP_COLORS = {
  1: { main: "#005C8B", secondary: "#ADD8E6" }, // Blue
  5: { main: "#B22222", secondary: "#FF7F50" }, // Red
  25: { main: "#006400", secondary: "#98FB98" }, // Green
  100: { main: "#333333", secondary: "#A9A9A9" }, // Black/Dark Gray
  500: { main: "#7B1FA2", secondary: "#CE93D8" }, // Purple
  1000: { main: "#8B4513", secondary: "#CD853F" }, // Brown/Chocolate
  5000: { main: "#DAA520", secondary: "#FFD700" }, // Gold
  10000: { main: "#A9A9A9", secondary: "#D3D3D3" }, // Silver
  50000: { main: "#006400", secondary: "#00FF00" }, // Green (Bright)
  100000: { main: "#FFD700", secondary: "#FFFF00" }, // Gold (Bright)
  500000: { main: "#8B0000", secondary: "#FF0000" }, // Red (Bright)
};

const ChipSVG: React.FC<{
  value: number;
  count?: number;
  className?: string;
  small?: boolean;
}> = ({ value, count = 1, className = "", small = false }) => {
  const colors =
    CHIP_COLORS[value as keyof typeof CHIP_COLORS] || CHIP_COLORS[1];

  const chipSize = small ? "20" : "30";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 50 50"
      className={`chip chip-${value} ${className}`}
      width={chipSize}
      height={chipSize}
    >
      {Array.from({ length: count }).map((_, i) => (
        <g key={i} transform={`translate(${i * 1.7}, 0)`}>
          <ellipse
            cx="25"
            cy="25"
            rx="20"
            ry="12"
            fill={colors.secondary}
            stroke={colors.main}
            strokeWidth="3"
          />
          <text
            x="25"
            y="30"
            textAnchor="middle"
            fontSize={small ? "10" : "12"}
            fill={colors.main}
          >
            {value}
          </text>
        </g>
      ))}
    </svg>
  );
};

// Displaying the pot - adding to the numerical value a casino chips display
const PotDisplay: React.FC<{
  potSize: number;
  isPlayerContribution?: boolean; // player contibution or Main pot?
}> = ({ potSize, isPlayerContribution = false }) => {
  if (!potSize) return null;

  const denominations = [
    500000, 100000, 50000, 10000, 5000, 1000, 500, 100, 25, 5, 1,
  ];
  let remainingPot = potSize;
  const chipCounts: { [key: number]: number } = {};

  denominations.forEach((denom) => {
    chipCounts[denom] = Math.floor(remainingPot / denom);
    remainingPot %= denom;
  });

  // For player contributions, we make the display more compact
  const containerClass = isPlayerContribution
    ? "player-pot-display"
    : "pot-display";

  return (
    <div className={containerClass}>
      <span className="font-bold">${potSize.toLocaleString()}</span>
      <div className="flex space-x-1">
        {denominations
          .filter((denom) => chipCounts[denom] > 0)
          .map((denom) => (
            <ChipSVG
              className="chip"
              key={denom}
              value={denom}
              count={chipCounts[denom]}
              small={isPlayerContribution}
            />
          ))}
      </div>
    </div>
  );
};

export default PotDisplay;
