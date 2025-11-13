// components/flash-sale/time-slots.tsx
"use client";
import { useState } from "react";

interface TimeSlot {
  time: string;
  label: string;
  highlight: boolean;
}

interface TimeSlotsProps {
  times: TimeSlot[];
  onTimeChange?: (index: number) => void;
}

export function TimeSlots({ times, onTimeChange }: TimeSlotsProps) {
  const [activeTime, setActiveTime] = useState(0);

  const handleTimeClick = (index: number) => {
    setActiveTime(index);
    onTimeChange?.(index);
  };

  return (
    <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-4 py-4 shadow-lg">
      <div className="mx-auto max-w-7xl">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-gray-300">
          Khung giờ bán hàng
        </p>

        <div className="grid grid-cols-3 gap-2 md:grid-cols-5 md:gap-3">
          {times.map((slot, idx) => (
            <button
              key={idx}
              onClick={() => handleTimeClick(idx)}
              className={`flex flex-col items-center rounded-xl px-2 py-3 text-xs font-bold transition-all md:text-sm
                ${
                  activeTime === idx
                    ? "scale-105 bg-red-500 text-white shadow-md"
                    : "bg-gray-700 text-gray-200 hover:bg-gray-600"
                }`}
            >
              <span className="text-sm font-black md:text-base">
                {slot.time}
              </span>
              <span className="mt-1 text-[11px] leading-tight md:text-xs">
                {slot.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
