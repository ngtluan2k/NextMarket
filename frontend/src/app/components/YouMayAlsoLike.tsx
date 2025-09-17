import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

/* ==== Types ==== */
export type LikeItem = {
  id: number | string;
  name: string;
  imageUrl: string;
  href?: string;
  slug?: string;
  price?: number | string;
  oldPrice?: number | string;
  percentOff?: number | string;
  rating?: number;
  ratingCount?: number;
  deliveryText?: string;
};

type Props = {
  title?: string;
  className?: string;
  skeletonCount?: number;
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
export default function YouMayAlsoLikeProducts({
  title = "Bạn có thể thích",
  className = "",
  skeletonCount = 10,
}: Props) {
  const [list, setList] = useState<LikeItem[]>(FALLBACK);
  const [loading, setLoading] = useState(true);

  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const navigate = useNavigate();

  // Fetch products API
  useEffect(() => {
    let cancelled = false;

    const fetchProducts = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:3000/products", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        const data: any[] = await res.json();

        const mapped: LikeItem[] = data.map((p) => {
          const primaryMedia = p.media?.find((m: any) => m.is_primary) || p.media?.[0];
          const mainVariant = p.variants?.[0];
          const price = Number(mainVariant?.price || p.base_price || 0);
          const oldPrice = p.base_price && price < Number(p.base_price) ? Number(p.base_price) : undefined;
          const percentOff = oldPrice ? Math.round(((oldPrice - price) / oldPrice) * 100) : undefined;

          return {
            id: p.id,
            name: p.name,
            imageUrl: primaryMedia?.url || ph(),
            price,
            oldPrice,
            percentOff,
            slug: p.slug,
          };
        });

        if (!cancelled) setList(mapped);
      } catch (e: any) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchProducts();
    return () => { cancelled = true; };
  }, []);

  // Scroll arrow state
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

  const data = useMemo(() => (list.length ? list : FALLBACK), [list]);

  const scrollByCards = (dir: "next" | "prev") => {
    const el = scrollerRef.current;
    if (!el) return;
    const CARD = 176;
    el.scrollBy({ left: dir === "next" ? CARD * 3 : -CARD * 3, behavior: "smooth" });
  };

  const handleClick = (slug?: string) => {
    if (!slug) return;
    navigate(`/products/slug/${slug}`);
  };

  return (
    <section className={`rounded-2xl bg-white shadow-xl ring-1 ring-slate-200 p-4 ${className}`}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      </div>

      <div className="relative">
        <button
          aria-label="Trước"
          onClick={() => scrollByCards("prev")}
          disabled={!canPrev}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-full p-2 shadow-lg ring-1 ring-black/5
                     bg-sky-500 text-white hover:bg-sky-600 transition disabled:opacity-0 disabled:pointer-events-none"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <button
          aria-label="Sau"
          onClick={() => scrollByCards("next")}
          disabled={!canNext}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-full p-2 shadow-lg ring-1 ring-black/5
                     bg-sky-500 text-white hover:bg-sky-600 transition disabled:opacity-0 disabled:pointer-events-none"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <div
          ref={scrollerRef}
          className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 no-scrollbar"
          style={{ scrollbarWidth: "none" }}
        >
          {loading &&
            Array.from({ length: skeletonCount }).map((_, i) => (
              <div key={i} className="snap-start shrink-0 w-[160px] animate-pulse rounded-xl bg-slate-100 h-[200px]" />
            ))}

          {data.map((p) => (
            <div
              key={p.id}
              className="snap-start shrink-0 w-[160px] rounded-xl border border-slate-200 bg-white p-3 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleClick(p.slug)}
            >
              <div className="rounded-lg bg-slate-50">
                <img
                  src={p.imageUrl || ph()}
                  alt={p.name}
                  className="aspect-[3/4] w-full rounded-lg object-contain"
                />
              </div>
              <div className="mt-2 line-clamp-2 min-h-[34px] text-xs text-slate-900">{p.name}</div>
              {p.price != null && (
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {typeof p.price === "number" ? p.price.toLocaleString("vi-VN") + "đ" : p.price}
                </div>
              )}
              {(p.percentOff != null || p.oldPrice != null) && (
                <div className="mt-0.5 flex items-center gap-2">
                  {p.percentOff != null && (
                    <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[11px] font-semibold text-rose-600">
                      -{p.percentOff}%
                    </span>
                  )}
                  {p.oldPrice != null && (
                    <span className="text-[11px] text-slate-400 line-through">
                      {typeof p.oldPrice === "number" ? p.oldPrice.toLocaleString("vi-VN") + "đ" : p.oldPrice}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
