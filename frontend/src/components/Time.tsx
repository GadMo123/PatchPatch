import React, { useState, useEffect } from 'react';

interface TimeProps {
    limit: number;  // Time limit in seconds
  }

  
const Time: React.FC<TimeProps> = ({limit}) => {
    const [elapsedTime, setElapsedTime] = useState<number>(0);

    useEffect(() => {
        const startTime = Date.now();

        // Update the elapsed time every second
        const timer = setInterval(() => {
            const currentElapsedTime = Math.floor((Date.now() - startTime) / 1000);
            
            // If elapsed time exceeds the limit, stop the timer
            if (currentElapsedTime >= limit) {
                clearInterval(timer);
            } else {
                setElapsedTime(currentElapsedTime);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const minutes = Math.floor(elapsedTime / 60).toString().padStart(2, '0');
    const seconds = (elapsedTime % 60).toString().padStart(2, '0');

    return (
        <div className="time">
            <div className="text-time">
                {minutes}:{seconds}
            </div>
        </div>
    );
};

export default Time;