import React, { useEffect, useState } from "react";

interface WinningAnimationProps {
  amount: number;
  animationTime: number; // Duration in milliseconds
  onComplete: () => void;
}

const WinningAnimation: React.FC<WinningAnimationProps> = ({
  amount,
  animationTime,
  onComplete,
}) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Move to step-1 (appear & move up)
    const step1Timeout = setTimeout(() => {
      setStep(1);
    }, 100); // Small delay to trigger transition smoothly

    // Move to step-2 (fade out & move further)
    const step2Timeout = setTimeout(() => {
      setStep(2);
    }, animationTime * 0.7); // 70% of animationTime

    // Complete animation & cleanup
    const completeTimeout = setTimeout(() => {
      setStep(0);
      onComplete();
    }, animationTime);

    return () => {
      clearTimeout(step1Timeout);
      clearTimeout(step2Timeout);
      clearTimeout(completeTimeout);
    };
  }, [animationTime, onComplete]);

  return (
    <div
      className={`winning-animation step-${step}`}
      style={
        { "--animation-duration": `${animationTime}ms` } as React.CSSProperties
      }
    >
      <span className="amount-text">+${amount}</span>
    </div>
  );
};

export default WinningAnimation;
