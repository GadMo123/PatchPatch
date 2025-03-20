import { useEffect, useState } from "react";
import { useAnimationTheme } from "../../contexts/AnimationThemeProvider";
import "./ShowdownView.css";

// Component to handle stack increase animation
export const WinningAnimation: React.FC<{
  amount: number;
  onComplete: () => void;
}> = ({ amount, onComplete }) => {
  const { animationLevel } = useAnimationTheme();
  const [animationStep, setAnimationStep] = useState(0);

  useEffect(() => {
    if (animationLevel === "low") {
      // Skip animation if animations are disabled
      onComplete();
      return;
    }

    const timeout = setTimeout(() => {
      setAnimationStep(1);

      const finalTimeout = setTimeout(() => {
        setAnimationStep(2);
        onComplete();
      }, 1000);

      return () => clearTimeout(finalTimeout);
    }, 1000);

    return () => clearTimeout(timeout);
  }, [onComplete, animationLevel]);

  if (animationLevel === "low") return null;

  return (
    <div
      className={`winning-animation step-${animationStep} --${animationLevel}`}
    >
      <div className="amount-text">+${amount}</div>
    </div>
  );
};
