// components/flash-sale/header.tsx
"use client";

import { useState, useEffect } from "react";
import { Zap, Clock } from "lucide-react";

interface FlashSaleHeaderProps {
  endsAt: Date | null;
}

export function FlashSaleHeader({ endsAt }: FlashSaleHeaderProps) {
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

  const segments = [
    String(timeRemaining.hours).padStart(2, "0"),
    String(timeRemaining.minutes).padStart(2, "0"),
    String(timeRemaining.seconds).padStart(2, "0"),
  ];

  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-2">
        <div className="flex items-center gap-4">
          <div className="hidden h-px flex-1 bg-gray-200 sm:block" />

          <div className="flex items-center gap-3 text-xs sm:text-sm">
            <div className="flex items-center gap-1">
              <Zap className="h-4 w-4 text-orange-500" />
              <span className="font-extrabold tracking-[0.14em] text-orange-500">
                FLASH SALE
              </span>
            </div>

            <div className="flex items-center gap-1 text-gray-700">
              <Clock className="h-3 w-3" />
              <span className="text-[11px] font-medium uppercase">
                Kết thúc trong
              </span>
            </div>

            {isHydrated && (
              <div className="flex items-center gap-1">
                {segments.map((val, idx) => (
                  <div key={idx} className="flex items-center">
                    <span className="inline-flex min-w-[26px] items-center justify-center rounded-[3px] bg-black px-1.5 py-0.5 text-[11px] font-mono font-semibold text-white">
                      {val}
                    </span>
                    {idx < segments.length - 1 && (
                      <span className="mx-[2px] text-[11px] font-bold text-gray-800">
                        :
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="hidden h-px flex-1 bg-gray-200 sm:block" />
        </div>
      </div>
    </div>
  );
}
