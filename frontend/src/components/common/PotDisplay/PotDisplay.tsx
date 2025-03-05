import React from "react";
import "./PotDisplay.css";
import { useAnimationTheme } from "../../../contexts/AnimationThemeProvider"; // Adjust path as needed

const CHIP_COLORS = {
  1: { main: "#005C8B", secondary: "#00D2FF" }, // Blue ($1) with neon blue edge
  5: { main: "#B22222", secondary: "#FFFF00" }, // Red ($5) with neon yellow edge
  10: { main: "#87CEEB", secondary: "#00FF9D" }, // Light Blue ($10) with neon green edge
  25: { main: "#006400", secondary: "#FFFF00" }, // Green ($25) with neon yellow edge
  100: { main: "#333333", secondary: "#00D2FF" }, // Black ($100) with neon blue edge
  500: { main: "#7B1FA2", secondary: "#FF007A" }, // Purple ($500) with neon pink edge
  1000: { main: "#DAA520", secondary: "#FFD700" }, // Yellow ($1,000) with gold edge
  5000: { main: "#FFA500", secondary: "#FFD700" }, // Orange ($5,000) with gold edge
  10000: { main: "#FFD700", secondary: "#FFFF00" }, // Gold ($10,000) with neon yellow edge
  50000: { main: "#C0C0C0", secondary: "#FFFFFF" }, // Silver ($50,000) with white edge
  100000: { main: "#E5E4E2", secondary: "#C0C0C0" }, // Platinum ($100,000) with silver edge
  500000: { main: "#B9F2FF", secondary: "#00D2FF" }, // Diamond ($500,000) with neon blue edge
};

const ChipSVG: React.FC<{
  value: number;
  count?: number;
  className?: string;
  small?: boolean;
}> = ({ value, count = 1, className = "", small = false }) => {
  const colors =
    CHIP_COLORS[value as keyof typeof CHIP_COLORS] || CHIP_COLORS[1];

  const chipSize = small ? "30" : "40"; // Slightly larger for better visibility

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 50 50"
      className={`chip chip-${value} ${small ? "small" : ""} ${className}`}
      width={chipSize}
      height={chipSize === "40" ? "24" : "18"} // Adjusted height for chip shape
    >
      {Array.from({ length: count }).map((_, i) => (
        <g key={i} transform={`translate(0, ${i * -2})`}>
          {" "}
          {/* Slight vertical offset for stacking */}
          <ellipse
            cx="25"
            cy="25"
            rx="20"
            ry="12"
            fill={
              colors.secondary
            } /* Use secondary (neon) color for the outer fill */
            stroke={
              colors.main
            } /* Use main (poker convention) color for the border */
            strokeWidth="3"
          />
          <text
            x="25"
            y="30"
            textAnchor="middle"
            fontSize={small ? "10" : "12"}
            fill={colors.main} /* Use main color for text */
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
  isPlayerContribution?: boolean; // Player contribution or main pot?
}> = ({ potSize, isPlayerContribution = false }) => {
  const { animationLevel } = useAnimationTheme();
  if (!potSize) return null;

  const denominations = [
    500000, 100000, 50000, 10000, 5000, 1000, 500, 100, 25, 10, 5, 1,
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
    <div className={`${containerClass} --${animationLevel}`}>
      <span className={`font-bold --${animationLevel}`}>
        ${potSize.toLocaleString()}
      </span>
      <div className="chip-stack-container">
        {denominations
          .filter((denom) => chipCounts[denom] > 0)
          .sort((a, b) => a - b) // Sort by increasing value for left-to-right arrangement
          .map((denom) => (
            <div className="chip-column" key={denom}>
              <div className="chip-stack">
                <ChipSVG
                  className={`chip --${animationLevel}`}
                  value={denom}
                  count={chipCounts[denom]}
                  small={isPlayerContribution}
                />
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default PotDisplay;
