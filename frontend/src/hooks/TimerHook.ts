import { useState, useEffect, useRef, useCallback } from "react";

interface TimerConfig {
  // Time remaining in seconds, updated from server
  serverTimeRemaining: number;
  onComplete?: () => void;
}

export function useCountdownTimer({
  serverTimeRemaining,
  onComplete,
}: TimerConfig): [number, () => void] {
  const [timeLeft, setTimeLeft] = useState(serverTimeRemaining);
  const timerRef = useRef<NodeJS.Timeout>(null);
  const isManuallyCancelled = useRef(false);
  const hasInitialized = useRef(false);

  // Handle server time updates
  useEffect(() => {
    console.log("timer update : " + serverTimeRemaining);
    setTimeLeft(serverTimeRemaining);
    if (serverTimeRemaining > 0) hasInitialized.current = true;
  }, [serverTimeRemaining]);

  // Handle countdown
  useEffect(() => {
    if (!hasInitialized.current) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (timeLeft <= 0 || isManuallyCancelled.current) {
      if (!isManuallyCancelled.current) {
        onComplete?.();
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev - 1000;
        if (newTime <= 0) {
          clearInterval(timerRef.current as NodeJS.Timeout);
          if (!isManuallyCancelled.current) {
            onComplete?.();
          }
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timeLeft]);

  const cancelTimer = useCallback(() => {
    isManuallyCancelled.current = true;
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    hasInitialized.current = false;
    setTimeLeft(0);
  }, []);

  return [timeLeft, cancelTimer];
}
