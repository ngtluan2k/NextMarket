import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Image as ImageIcon, Star } from "lucide-react";

export type SimilarItem = {
  id?: string;
  name?: string;
  image?: string;
  price?: number;
  listPrice?: number;
  rating?: number;
  reviewsCount?: number;
  href?: string;
};

type Props = {
  title?: string;
  items?: SimilarItem[];
  loading?: boolean;

  // layout
  cols?: number;   // số cột mỗi trang (mặc định 4)
  rows?: number;   // số hàng mỗi trang (mặc định 2)

  onOpen?: (item: SimilarItem) => void;
};

const fmt = (n?: number) =>
  (n ?? 0).toLocaleString("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

function Stars({ value = 0 }: { value?: number }) {
  const full = Math.floor(Math.max(0, Math.min(5, value)));
  return (
    <div className="flex items-center gap-0.5 text-amber-500">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`h-3.5 w-3.5 ${i < full ? "fill-current" : ""}`} />
      ))}
    </div>
  );
}

export default function SimilarProductsCarousel({
  title = "Sản phẩm tương tự",
  items = [],
  loading = false,
  cols = 4,
  rows = 2,
  onOpen,
}: Props) {
  const pageSize = Math.max(1, cols * rows);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const [page, setPage] = useState(0);

  const start = page * pageSize;
  const current = useMemo(() => items.slice(start, start + pageSize), [items, start, pageSize]);

  const canPrev = page > 0;
  const canNext = page < totalPages - 1;

  const skeletonCount = pageSize - current.length;
  const slots: Array<SimilarItem & { __ph?: boolean }> =
    loading
      ? Array.from({ length: pageSize }).map(() => ({ __ph: true }))
      : [...current, ...Array.from({ length: Math.max(0, skeletonCount) }).map(() => ({ __ph: true }))];

  return (
    <section className="relative rounded-2xl bg-white p-5 ring-1 ring-slate-200">
      <h3 className="mb-3 text-base font-semibold text-slate-900">{title}</h3>

      {/* 2 hàng × 4 cột */}
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {slots.map((x, i) => (
          <button
            key={x.id ?? `ph-${i}`}
            onClick={() => (!x.__ph ? (onOpen ? onOpen(x) : x.href ? (window.location.href = x.href) : null) : null)}
            className="rounded-2xl border border-slate-200 p-3 text-left hover:shadow-sm"
          >
            <div className="aspect-[4/4.6] w-full overflow-hidden rounded bg-slate-50 grid place-items-center">
              {x.__ph ? (
                <div className="text-slate-300 text-sm flex flex-col items-center">
                  <ImageIcon className="mb-1 h-5 w-5" />
                  No image
                </div>
              ) : x.image ? (
                <img src={x.image} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="text-slate-300 text-sm flex flex-col items-center">
                  <ImageIcon className="mb-1 h-5 w-5" />
                  No image
                </div>
              )}
            </div>

            <div className="mt-2 line-clamp-2 text-sm text-slate-800">
              {x.__ph ? "Đang cập nhật..." : x.name || "Đang cập nhật..."}
            </div>

            {!x.__ph && (
              <>
                <div className="mt-1 flex items-center gap-2">
                  <Stars value={x.rating} />
                  <span className="text-xs text-slate-500">{x.reviewsCount ?? 0}</span>
                </div>
                {x.price ? <div className="mt-1 font-semibold">{fmt(x.price)}</div> : null}
                {x.listPrice ? (
                  <div className="text-xs text-slate-400 line-through">{fmt(x.listPrice)}</div>
                ) : null}
              </>
            )}
          </button>
        ))}
      </div>

      {/* mũi tên điều hướng – đặt giữa chiều cao section 2 hàng */}
      <button
        aria-label="Prev"
        onClick={() => canPrev && setPage((p) => p - 1)}
        disabled={!canPrev}
        className={`absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white p-2 shadow ring-1 ring-slate-200
                    ${!canPrev ? "opacity-40 cursor-not-allowed" : "hover:bg-slate-50"}`}
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <button
        aria-label="Next"
        onClick={() => canNext && setPage((p) => p + 1)}
        disabled={!canNext}
        className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white p-2 shadow ring-1 ring-slate-200
                    ${!canNext ? "opacity-40 cursor-not-allowed" : "hover:bg-slate-50"}`}
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* dots */}
      <div className="mt-3 flex justify-center gap-1">
        {Array.from({ length: totalPages }).map((_, i) => (
          <span
            key={i}
            className={`h-1.5 w-6 rounded-full ${i === page ? "bg-slate-600" : "bg-slate-300"}`}
          />
        ))}
      </div>
    </section>
  );
}
