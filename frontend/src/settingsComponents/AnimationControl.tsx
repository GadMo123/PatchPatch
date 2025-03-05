import { Slider } from "../components/common/slider/Slider";
import { useAnimationTheme } from "../contexts/AnimationThemeProvider";
import "./AnimationControl.css";

// Component to control animation level with the Slider
const AnimationControl: React.FC = () => {
  const { animationLevel, setAnimationLevel } = useAnimationTheme();

  // Map animation levels to slider values
  const animationLevels = ["low", "mid", "high"];
  const min = 0;
  const max = animationLevels.length - 1;

  // Convert animation level to slider value
  const getSliderValue = (level: "low" | "mid" | "high") => {
    return animationLevels.indexOf(level);
  };

  // Handle slider change
  const handleAnimationChange = (value: number) => {
    const newLevel = animationLevels[value] as "low" | "mid" | "high";
    setAnimationLevel(newLevel);
  };

  return (
    <div className="animation-settings">
      <span role="img" aria-label="Settings" className="settings-icon">
        ⚙️
      </span>
      <Slider
        min={min}
        max={max}
        value={getSliderValue(animationLevel)}
        onChange={handleAnimationChange}
        step={1}
        customTicks={[0, 1, 2]}
        formatValue={(val) => animationLevels[val]}
        showInput={false}
      />
    </div>
  );
};

export default AnimationControl;
