import React, { createContext, useState, useEffect, ReactNode } from "react";

interface AnimationThemeContextValue {
  animationLevel: "high" | "mid" | "low";
  setAnimationLevel: (level: "high" | "mid" | "low") => void;
}

const AnimationThemeContext = createContext<
  AnimationThemeContextValue | undefined
>(undefined);

interface AnimationThemeProviderProps {
  children: ReactNode;
}

const getDefaultAnimationLevel = (): "high" | "mid" | "low" => {
  const hardwareConcurrency = navigator.hardwareConcurrency || 4; // default to 4 if not available

  // Auto-detect performance based on device capabilities
  if (hardwareConcurrency <= 1) {
    return "low"; // Low animation for weaker devices
  }
  if (hardwareConcurrency <= 3) {
    return "mid"; // Mid animation for moderate devices
  }
  return "high"; // High animation for powerful devices
};

export const AnimationThemeProvider: React.FC<AnimationThemeProviderProps> = ({
  children,
}) => {
  const [animationLevel, setAnimationLevel] = useState<"high" | "mid" | "low">(
    getDefaultAnimationLevel()
  );

  useEffect(() => {
    const elements = document.getElementsByTagName("*");
    const animationClasses = ["--high", "--mid", "--low"];
    for (let element of elements) {
      element.classList.remove(...animationClasses);
      element.classList.add(`--${animationLevel}`);
    }
  }, [animationLevel]);

  const value = {
    animationLevel,
    setAnimationLevel,
  };

  return (
    <AnimationThemeContext.Provider value={value}>
      {children}
    </AnimationThemeContext.Provider>
  );
};

export const useAnimationTheme = () => {
  const context = React.useContext(AnimationThemeContext);
  if (context === undefined) {
    throw new Error(
      "useAnimationTheme must be used within an AnimationThemeProvider"
    );
  }
  return context;
};
