import React from 'react';
import { Star, StarHalf } from 'lucide-react';

export default function Stars({ value = 0 }: { value?: number }) {
  const safe = Math.max(0, Math.min(5, value ?? 0));
  const full = Math.floor(safe);
  const half = safe - full >= 0.5;
  return (
    <div className="flex items-center gap-0.5 text-amber-500">
      {Array.from({ length: full }).map((_, i) => (
        <Star key={i} className="h-4 w-4 fill-current" />
      ))}
      {half && <StarHalf className="h-4 w-4 fill-current" />}
      {Array.from({ length: 5 - full - (half ? 1 : 0) }).map((_, i) => (
        <Star key={`e${i}`} className="h-4 w-4" />
      ))}
    </div>
  );
}
