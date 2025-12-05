// components/flash-sale/time-slots.tsx
"use client";

import { useState } from "react";
import type { FlashSaleTimeSlot } from "./types";

interface TimeSlotsProps {
  slots: FlashSaleTimeSlot[];
  onSlotChange?: (index: number, slot: FlashSaleTimeSlot) => void;
}

export function TimeSlots({ slots, onSlotChange }: TimeSlotsProps) {
  const [activeSlotIndex, setActiveSlotIndex] = useState(0);

  const handleSlotClick = (index: number) => {
    setActiveSlotIndex(index);
    const slot = slots[index];
    if (slot) {
      onSlotChange?.(index, slot);
    }
  };

  return (
    <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-4 py-4 shadow-lg">
      <div className="mx-auto max-w-7xl">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-gray-300">
          Khung giờ bán hàng
        </p>

        <div className="grid grid-cols-3 gap-2 md:grid-cols-5 md:gap-3">
          {slots.map((slot, idx) => {
            const isActive = activeSlotIndex === idx;

            return (
              <button
                key={slot.time}
                onClick={() => handleSlotClick(idx)}
                className={`flex flex-col items-center rounded-xl px-2 py-3 text-xs font-bold transition-all md:text-sm
                  ${
                    isActive
                      ? "scale-105 bg-red-500 text-white shadow-md"
                      : "bg-gray-700 text-gray-200 hover:bg-gray-600"
                  }
                  ${slot.isHighlighted ? "ring-2 ring-red-300" : ""}`}
              >
                <span className="text-sm font-black md:text-base">
                  {slot.time}
                </span>
                <span className="mt-1 text-[11px] leading-tight md:text-xs">
                  {slot.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
