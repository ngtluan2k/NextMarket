import React from "react";

export function ProductCardSkeleton() {
  return (
    <div className="rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm p-3">
      {/* Vùng ảnh */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-slate-100">
        {/* shimmer */}
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100" />
        {/* text No image */}
        <div className="absolute inset-0 grid place-items-center">
          <span className="text-[11px] text-slate-400 select-none">No image</span>
        </div>
      </div>

      {/* dòng “Đang cập nhật…” */}
      <div className="mt-2 text-[12px] text-slate-400">Đang cập nhật…</div>
    </div>
  );
}

/** Grid skeleton – vẽ N thẻ giống nhau */
export default function ProductGridSkeleton({ count = 20 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
