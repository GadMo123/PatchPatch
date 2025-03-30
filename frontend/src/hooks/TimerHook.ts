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
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isManuallyCancelled = useRef(false);
  const lastServerTime = useRef(serverTimeRemaining);

  // Handle server time updates
  useEffect(() => {
    console.log("timer update: " + serverTimeRemaining);

    // Only reset the timer if we're getting a fresh timer value from the server
    if (
      serverTimeRemaining > 0 &&
      (serverTimeRemaining !== lastServerTime.current || timeLeft <= 0)
    ) {
      // Reset timer state for a new round
      isManuallyCancelled.current = false;
      setTimeLeft(serverTimeRemaining);
      lastServerTime.current = serverTimeRemaining;
    }
  }, [serverTimeRemaining, timeLeft]);

  // Handle countdown
  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // If timer is complete or cancelled, don't start a new one
    if (timeLeft <= 0 || isManuallyCancelled.current) {
      if (timeLeft <= 0 && !isManuallyCancelled.current) {
        onComplete?.();
      }
      return;
    }

    // Start a new timer
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev - 1000;
        if (newTime <= 0) {
          clearInterval(timerRef.current as NodeJS.Timeout);
          timerRef.current = null;
          if (!isManuallyCancelled.current) {
            onComplete?.();
          }
          return 0;
        }
        return newTime;
      });
    }, 1000);

    // Cleanup on unmount or dependencies change
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [timeLeft, onComplete]);

  const cancelTimer = useCallback(() => {
    isManuallyCancelled.current = true;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setTimeLeft(0);
  }, []);

  return [timeLeft, cancelTimer];
}
