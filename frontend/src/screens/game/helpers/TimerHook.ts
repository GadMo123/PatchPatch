import { useState, useEffect, useRef, useCallback } from 'react';

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

  // Handle server time updates
  useEffect(() => {
    setTimeLeft(serverTimeRemaining);
  }, [serverTimeRemaining]);

  // Handle countdown
  useEffect(() => {
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
      setTimeLeft(prev => {
        const newTime = prev - 1;
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
    setTimeLeft(0);
  }, []);

  return [timeLeft, cancelTimer];
}
