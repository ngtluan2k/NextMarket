// components/flash-sale/countdown-timer.tsx
"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface CountdownTimerProps {
  endsAt: Date | null;
}

export function CountdownTimer({ endsAt }: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
    if (!endsAt) return;

    const timer = setInterval(() => {
      const now = new Date();
      const diff = endsAt.getTime() - now.getTime();

      if (diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeRemaining({ hours, minutes, seconds });
      } else {
        setTimeRemaining({ hours: 0, minutes: 0, seconds: 0 });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endsAt]);

  return (
    <div className="bg-gradient-to-br from-slate-50 to-gray-100 px-4 py-6">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-2xl border border-gray-200 bg-white px-4 py-5 shadow-md">
          <div className="mb-4 flex items-center justify-center gap-2">
            <Clock className="h-5 w-5 animate-spin text-red-600" />
            <span className="text-base font-bold text-gray-900 md:text-lg">
              Flash Sale kết thúc trong
            </span>
          </div>

          <div className="flex items-center justify-center gap-4 md:gap-6">
            {[
              { label: "Giờ", value: isHydrated ? timeRemaining.hours : 0 },
              { label: "Phút", value: isHydrated ? timeRemaining.minutes : 0 },
              { label: "Giây", value: isHydrated ? timeRemaining.seconds : 0 },
            ].map((item, idx) => (
              <div key={item.label} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-red-700 text-2xl font-black text-white shadow-lg md:h-20 md:w-20 md:text-3xl">
                    {String(item.value).padStart(2, "0")}
                  </div>
                  <span className="mt-2 text-xs font-semibold text-gray-700 md:text-sm">
                    {item.label}
                  </span>
                </div>
                {idx < 2 && (
                  <div className="mx-3 text-2xl font-black text-red-600 md:text-3xl">
                    :
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
