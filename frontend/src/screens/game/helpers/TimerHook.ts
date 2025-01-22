import { useState, useEffect, useRef } from 'react';

interface TimerConfig {
  // Time remaining in seconds, updated from server
  serverTimeRemaining: number;
  onComplete?: () => void;
}

export function useCountdownTimer({
  serverTimeRemaining,
  onComplete,
}: TimerConfig) {
  const [timeLeft, setTimeLeft] = useState(serverTimeRemaining);
  const timerRef = useRef<NodeJS.Timeout>(null);

  // Handle server time updates
  useEffect(() => {
    setTimeLeft(serverTimeRemaining);
  }, [serverTimeRemaining]);

  // Handle countdown
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (timeLeft <= 0) {
      onComplete?.();
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          clearInterval(timerRef.current as NodeJS.Timeout);
          onComplete?.();
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

  return timeLeft;
}
