import { useEffect, useState } from "react";

export function useCountdown(totalMinutes: number) {
  const isCountUp = totalMinutes === 0;
  const [remaining, setRemaining] = useState(isCountUp ? 0 : totalMinutes * 60);
  const [running, setRunning] = useState(true);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setRemaining((seconds) => {
        if (isCountUp) {
          return seconds + 1;
        } else {
          if (seconds <= 1) {
            setRunning(false);
            return 0;
          }
          return seconds - 1;
        }
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, isCountUp]);

  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;

  const display = hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    : `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const percentage = totalMinutes > 0 ? ((totalMinutes * 60 - remaining) / (totalMinutes * 60)) * 100 : 0;

  return { remaining, display, percentage, running, setRunning, isCountUp };
}

