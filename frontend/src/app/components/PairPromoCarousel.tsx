// src/components/PairPromoCarousel.tsx
import React, { useEffect, useMemo, useState } from "react";

export type PairCard = {
  id: string | number;
  title: string;
  sponsor?: string;    // ví dụ: "Tài trợ bởi Tiki Trading"
  ratingText?: string; // ví dụ: "5/5"
  coverUrl?: string;   // logo/ảnh to bên trái
  href?: string;       // nếu muốn click điều hướng
};

type Props = {
  items?: PairCard[];
  fetchItems?: () => Promise<PairCard[]>;
  className?: string;
  autoPlay?: boolean;
  interval?: number; // ms
};

const ph = (w = 140, h = 140) =>
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>
       <rect width='100%' height='100%' rx='24' fill='#F1F5F9'/>
       <text x='50%' y='50%' text-anchor='middle' dominant-baseline='middle'
             font-family='system-ui,Segoe UI,Roboto' font-size='13' fill='#94A3B8'>No image</text>
     </svg>`
  );

export default function PairPromoCarousel({
  items,
  fetchItems,
  className = "",
  autoPlay = true,
  interval = 6000,
}: Props) {
  const [list, setList] = useState<PairCard[]>(items ?? []);
  const [loading, setLoading] = useState<boolean>(!!fetchItems);

  // fetch nếu cần
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!fetchItems) return;
      try {
        setLoading(true);
        const data = await fetchItems();
        if (!cancelled && Array.isArray(data)) setList(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchItems]);

  // Gom 2 card / trang
  const groups = useMemo(() => {
    const arr = list ?? [];
    const out: PairCard[][] = [];
    for (let i = 0; i < arr.length; i += 2) out.push(arr.slice(i, i + 2));
    return out.length ? out : [[]];
  }, [list]);

  const [page, setPage] = useState(0);
  const max = Math.max(0, groups.length - 1);
  useEffect(() => setPage(0), [groups.length]);

  // autoplay
  useEffect(() => {
    if (!autoPlay || groups.length <= 1) return;
    const t = setInterval(() => setPage((p) => (p >= max ? 0 : p + 1)), interval);
    return () => clearInterval(t);
  }, [autoPlay, interval, groups.length, max]);

  return (
    <section className={`rounded-2xl bg-white ring-1 ring-slate-200 shadow p-3 md:p-4 ${className}`}>
      <div className="relative overflow-hidden">
        {/* arrows */}
        {groups.length > 1 && (
          <>
            <button
              aria-label="Prev"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-white/90 shadow ring-1 ring-slate-200 hover:bg-white"
            >
              ‹
            </button>
            <button
              aria-label="Next"
              onClick={() => setPage((p) => Math.min(max, p + 1))}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-white/90 shadow ring-1 ring-slate-200 hover:bg-white"
            >
              ›
            </button>
          </>
        )}

        {/* slides */}
        <div
          className="flex transition-transform duration-500"
          style={{
            transform: `translateX(-${page * 100}%)`,
            width: `${groups.length * 100}%`,
          }}
        >
          {groups.map((g, idx) => (
            <div key={idx} className="grid w-full grid-cols-1 md:grid-cols-2 gap-4 px-1">
              {g.map((c) => (
                <Card key={c.id} {...c} />
              ))}
              {/* nếu trang chỉ có 1 card thì chèn cột trống để cân layout */}
              {g.length < 2 && <div className="hidden md:block" />}
            </div>
          ))}
        </div>
      </div>

      {/* dots */}
      {groups.length > 1 && (
        <div className="mt-2 flex items-center justify-center gap-2">
          {groups.map((_, i) => (
            <button
              key={i}
              aria-label={`Trang ${i + 1}`}
              onClick={() => setPage(i)}
              className={`h-1.5 rounded-full transition-all ${
                page === i ? "w-6 bg-sky-600" : "w-2 bg-slate-300"
              }`}
            />
          ))}
        </div>
      )}

      {loading && <div className="mt-2 text-xs text-slate-500">Đang tải…</div>}
    </section>
  );

  function Card(c: PairCard) {
    const Body = (
      <div
        className="grid grid-cols-[110px_minmax(0,1fr)] md:grid-cols-[140px_minmax(0,1fr)] gap-4 
                   rounded-2xl bg-gradient-to-br from-slate-50 to-white p-4 ring-1 ring-slate-200 shadow-sm hover:shadow-md"
        style={{ minHeight: 138 }} // giữ chiều cao gần giống ảnh
      >
        <div className="rounded-2xl bg-white/70 ring-1 ring-slate-200 grid place-items-center overflow-hidden">
          <img
            src={c.coverUrl || ph()}
            alt={c.title}
            className="h-24 w-24 md:h-28 md:w-28 object-contain"
            onError={(e) => ((e.currentTarget as HTMLImageElement).src = ph())}
          />
        </div>
        <div className="flex min-w-0 flex-col justify-center">
          <h3 className="text-base md:text-lg font-semibold text-slate-900 line-clamp-2">{c.title}</h3>
          {(c.sponsor || c.ratingText) && (
            <div className="mt-1 text-sm text-slate-600">
              {c.sponsor && <span>{c.sponsor}</span>}
              {c.ratingText && <span className="ml-1">({c.ratingText})</span>}
            </div>
          )}
        </div>
      </div>
    );

    return c.href ? (
      <a href={c.href} className="block">{Body}</a>
    ) : (
      <div>{Body}</div>
    );
  }
}
