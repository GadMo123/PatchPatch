import React, { useState, useEffect, useCallback } from "react";

interface SliderProps {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  customTicks?: number[];
  formatValue?: (value: number) => string;
  showInput?: boolean;
}

export const Slider: React.FC<SliderProps> = ({
  min,
  max,
  value,
  onChange,
  step,
  customTicks,
  formatValue = (val) => val.toString(),
  showInput = true,
}) => {
  const [sliderValue, setSliderValue] = useState(value);

  // Calculate appropriate steps for the slider, default is linear
  const ticks =
    customTicks ||
    (step
      ? Array.from(
          { length: Math.floor((max - min) / step) + 1 },
          (_, i) => min + i * step
        )
      : [min, max]);

  // Find closest tick value
  const findClosestTick = useCallback(
    (val: number) => {
      return ticks.reduce((prev, curr) =>
        Math.abs(curr - val) < Math.abs(prev - val) ? curr : prev
      );
    },
    [ticks]
  );

  // Calculate percentage for visual display
  const calculatePercentage = useCallback(
    (val: number) => {
      return ((val - min) / (max - min)) * 100;
    },
    [min, max]
  );

  useEffect(() => {
    setSliderValue(value);
  }, [value]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);

    // If using custom ticks, map the slider's 0-100 to the correct tick value
    if (customTicks) {
      const percentage = newValue / 100;
      const tickIndex = Math.round(percentage * (ticks.length - 1));
      const tickValue = ticks[tickIndex];
      setSliderValue(tickValue);
      onChange(tickValue);
    } else {
      // For linear slider, find the closest tick if step is defined
      const closestValue = step ? findClosestTick(newValue) : newValue;
      setSliderValue(closestValue);
      onChange(closestValue);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = Number(e.target.value);
    if (!isNaN(inputValue) && inputValue >= min && inputValue <= max) {
      const closestValue = step ? findClosestTick(inputValue) : inputValue;
      setSliderValue(closestValue);
      onChange(closestValue);
    }
  };

  return (
    <div className="slider-container">
      <div className="slider-track">
        <input
          type="range"
          min={customTicks ? 0 : min}
          max={customTicks ? 100 : max}
          value={customTicks ? calculatePercentage(sliderValue) : sliderValue}
          onChange={handleSliderChange}
          step={customTicks ? 100 / (ticks.length - 1) : step}
          className="slider-input"
        />
        <div className="slider-ticks">
          {ticks.map((tick, index) => (
            <div
              key={index}
              className="slider-tick"
              style={{ left: `${calculatePercentage(tick)}%` }}
            >
              <div className="tick-mark"></div>
              <div className="tick-label">{formatValue(tick)}</div>
            </div>
          ))}
        </div>
      </div>
      {showInput && (
        <div className="slider-value-input">
          <input
            type="number"
            value={sliderValue}
            onChange={handleInputChange}
            min={min}
            max={max}
            className="value-input"
          />
        </div>
      )}
    </div>
  );
};
