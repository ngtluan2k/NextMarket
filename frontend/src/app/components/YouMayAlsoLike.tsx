import React, { useEffect, useMemo, useRef, useState } from "react";

/* ==== Types ==== */
export type LikeItem = {
  id: string | number;
  name: string;
  imageUrl: string;
  href?: string;

  // Tùy chọn: có thì hiển thị, không có thì bỏ qua
  price?: number | string;
  oldPrice?: number | string;
  percentOff?: number | string;
  rating?: number;
  ratingCount?: number;
  deliveryText?: string;
};

type Props = {
  title?: string;
  items?: LikeItem[];                       // Có thể truyền sẵn
  fetchItems?: () => Promise<LikeItem[]>;   // Hoặc dùng API
  className?: string;
};

/* ==== Helpers ==== */
const ph = (w = 220, h = 220) =>
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>
       <rect width='100%' height='100%' rx='16' fill='#F1F5F9'/>
       <text x='50%' y='50%' text-anchor='middle' dominant-baseline='middle'
             font-family='system-ui,Segoe UI,Roboto' font-size='12' fill='#94A3B8'>No image</text>
     </svg>`
  );

const FALLBACK: LikeItem[] = Array.from({ length: 10 }).map((_, i) => ({
  id: `sk-${i}`,
  name: "Đang cập nhật…",
  imageUrl: ph(),
}));

/* ==== Component ==== */
export default function YouMayAlsoLike({
  title = "Bạn có thể thích",
  items,
  fetchItems,
  className = "",
}: Props) {
  const [list, setList] = useState<LikeItem[]>(items ?? FALLBACK);
  const [loading, setLoading] = useState<boolean>(!!fetchItems);

  const scrollerRef = useRef<HTMLUListElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  // Fetch khi có API
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!fetchItems) return;
      try {
        setLoading(true);
        const data = await fetchItems();
        if (!cancelled && data?.length) setList(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchItems]);

  // Theo dõi trạng thái mũi tên
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const update = () => {
      const { scrollLeft, scrollWidth, clientWidth } = el;
      setCanPrev(scrollLeft > 0);
      setCanNext(scrollLeft + clientWidth < scrollWidth - 1);
    };

    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [list]);

  const data = useMemo(() => (list?.length ? list : FALLBACK), [list]);

  const scrollBy = (dir: "next" | "prev") => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = Math.round(el.clientWidth * 0.9);
    el.scrollBy({ left: dir === "next" ? amount : -amount, behavior: "smooth" });
  };

  return (
    <section className={`rounded-2xl bg-white shadow-xl ring-1 ring-slate-200 p-4 ${className}`}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      </div>

      <div className="relative">
        {/* Prev arrow */}
        <button
          aria-label="Trước"
          onClick={() => scrollBy("prev")}
          disabled={!canPrev}
          className={`absolute left-1 top-1/2 -translate-y-1/2 z-10 rounded-full p-2 shadow-lg ring-1 ring-black/5
                      bg-sky-500 text-white hover:bg-sky-600 transition disabled:opacity-0 disabled:pointer-events-none`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Next arrow */}
        <button
          aria-label="Sau"
          onClick={() => scrollBy("next")}
          disabled={!canNext}
          className={`absolute right-1 top-1/2 -translate-y-1/2 z-10 rounded-full p-2 shadow-lg ring-1 ring-black/5
                      bg-sky-500 text-white hover:bg-sky-600 transition disabled:opacity-0 disabled:pointer-events-none`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Scroller */}
        <ul
          ref={scrollerRef}
          className="flex gap-4 overflow-x-auto scroll-smooth pb-2 snap-x snap-mandatory
                     [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {data.map((p) => (
            <li
              key={p.id}
              className="snap-start shrink-0 w-[240px] rounded-xl border border-slate-200 bg-white p-3 hover:shadow-md transition-shadow"
            >
              <a href={p.href || "#"} className="block">
                <div className="rounded-lg bg-slate-50">
                  <img
                    src={p.imageUrl || ph()}
                    alt={p.name}
                    className="aspect-[3/4] w-full rounded-lg object-contain"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = ph();
                    }}
                  />
                </div>

                <div className="mt-2 line-clamp-2 min-h-[34px] text-xs text-slate-900">{p.name}</div>

                {/* Rating nếu có */}
                {typeof p.rating === "number" && (
                  <div className="mt-1 flex items-center gap-1">
                    <Stars value={p.rating} />
                    {typeof p.ratingCount === "number" && (
                      <span className="text-[10px] text-slate-500">({p.ratingCount})</span>
                    )}
                  </div>
                )}

                {/* Giá nếu có */}
                {p.price != null && (
                  <div className="mt-1 text-sm font-semibold text-slate-900">
                    {typeof p.price === "number" ? p.price.toLocaleString("vi-VN") + "đ" : p.price}
                  </div>
                )}

                {/* Giảm % + giá cũ nếu có */}
                {(p.percentOff != null || p.oldPrice != null) && (
                  <div className="mt-0.5 flex items-center gap-2">
                    {p.percentOff != null && (
                      <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[11px] font-semibold text-rose-600">
                        -{typeof p.percentOff === "number" ? `${p.percentOff}%` : p.percentOff}
                      </span>
                    )}
                    {p.oldPrice != null && (
                      <span className="text-[11px] text-slate-400 line-through">
                        {typeof p.oldPrice === "number"
                          ? p.oldPrice.toLocaleString("vi-VN") + "đ"
                          : p.oldPrice}
                      </span>
                    )}
                  </div>
                )}

                {/* Giao hàng nếu có */}
                {p.deliveryText && (
                  <div className="mt-2 text-[11px] text-slate-500">{p.deliveryText}</div>
                )}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {loading && <div className="mt-3 text-xs text-slate-500">Đang tải…</div>}
    </section>
  );
}

/* ---- tiny stars ---- */
function Stars({ value = 0 }: { value?: number }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <div className="flex items-center">
      {Array.from({ length: full }).map((_, i) => <Star key={`f${i}`} type="full" />)}
      {half && <Star type="half" />}
      {Array.from({ length: empty }).map((_, i) => <Star key={`e${i}`} type="empty" />)}
    </div>
  );
}
function Star({ type }: { type: "full" | "half" | "empty" }) {
  const fill = type === "empty" ? "none" : "#F59E0B";
  return (
    <svg width="12" height="12" viewBox="0 0 20 20" className="inline-block">
      <defs>
        <linearGradient id="half-grad-like" x1="0" x2="1">
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="50%" stopColor="transparent" />
        </linearGradient>
      </defs>
      <path
        d="M10 1.5l2.7 5.47 6.03.88-4.36 4.25 1.03 6-5.4-2.84L4.6 18.1l1.03-6L1.27 7.85l6.03-.88L10 1.5z"
        stroke="#F59E0B"
        strokeWidth="1"
        fill={type === "half" ? "url(#half-grad-like)" : fill}
      />
    </svg>
  );
}
