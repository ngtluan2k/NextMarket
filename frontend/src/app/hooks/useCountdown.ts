import { useEffect, useMemo, useState } from "react";

export function useCountdown(endAt: Date | string | number) {
  const end = useMemo(() => new Date(endAt).getTime(), [endAt]);
  const [msLeft, setMsLeft] = useState(() => Math.max(0, end - Date.now()));

  useEffect(() => {
    const id = setInterval(() => setMsLeft(Math.max(0, end - Date.now())), 1000);
    return () => clearInterval(id);
  }, [end]);

  const totalSeconds = Math.floor(msLeft / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { hours, minutes, seconds, isEnded: msLeft <= 0 };
}
