"use client";
import React from "react";
import { Clock } from "lucide-react";
import { useCountdown } from "../../hooks/useCountdown";

export function CountdownTimer({ endAt, label = "Flash Sale Kết Thúc Trong" }: {
  endAt: Date | string | number;
  label?: string;
}) {
  const { hours, minutes, seconds, isEnded } = useCountdown(endAt);
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl bg-gradient-to-r from-indigo-50 to-fuchsia-50 p-6 md:p-8">
      <div className="inline-flex items-center gap-2 text-lg font-semibold md:text-xl">
        <Clock className="h-5 w-5 text-indigo-600" />
        <span>{isEnded ? "Đã kết thúc" : label}</span>
      </div>
      {!isEnded && (
        <div className="flex gap-3 md:gap-4">
          {([
            { label: "Giờ", value: hours },
            { label: "Phút", value: minutes },
            { label: "Giây", value: seconds },
          ] as const).map((b, i) => (
            <div key={b.label} className="inline-flex items-center">
              <div className="flex flex-col items-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-indigo-600 text-2xl font-bold text-white md:h-20 md:w-20 md:text-3xl">
                  {String(b.value).padStart(2, "0")}
                </div>
                <span className="mt-2 text-xs font-medium text-gray-500 md:text-sm">{b.label}</span>
              </div>
              {i < 2 && <div className="mx-3 text-3xl font-bold text-indigo-600 md:text-4xl">:</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
