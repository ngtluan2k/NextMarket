
import React from "react";
import type { Category, LucideIcon } from "./types";
import { Smartphone, Laptop, Watch, Headphones, Camera, Gamepad2 } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Smartphone,
  Laptop,
  Watch,
  Headphones,
  Camera,
  Gamepad2,
};

export function CategoryTabs({
  categories,
  activeId,
  onChange,
}: {
  categories: Category[];
  activeId: string;
  onChange: (id: string) => void;
}) {
  return (
    <div id="categories" className="mb-8 overflow-x-auto">
      <div className="flex gap-2 pb-2">
        {categories.map((c) => {
          const Icon = c.iconKey ? iconMap[c.iconKey] : undefined;
          const isActive = activeId === c.id;
          return (
            <button
              key={c.id}
              onClick={() => onChange(c.id)}
              className={`inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                isActive ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {Icon ? <Icon className="h-4 w-4" /> : <span className="inline-block h-4 w-4" />}
              <span className="leading-none">{c.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
