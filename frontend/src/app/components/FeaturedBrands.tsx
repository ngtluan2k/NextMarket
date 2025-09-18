import React, { useEffect, useRef, useState } from 'react';

export type BrandCard = {
  id: string | number;
  coverUrl?: string; // ảnh hero / sản phẩm
  logoUrl?: string; // logo thương hiệu (optional)
  title?: string; // tên / nhãn
  tagline?: string; // mô tả ngắn (optional)
  href?: string; // link (optional)
};

type Props = {
  title?: string;
  items?: BrandCard[];
  fetchBrands?: () => Promise<BrandCard[]>;
  seeAllHref?: string;
  className?: string;
};

const ph = (w = 260, h = 160) =>
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>
      <defs><linearGradient id='g' x1='0' x2='1'>
        <stop offset='0' stop-color='#E2E8F0' />
        <stop offset='1' stop-color='#F1F5F9' />
      </linearGradient></defs>
      <rect rx='16' width='100%' height='100%' fill='url(#g)'/>
      <text x='50%' y='50%' text-anchor='middle' dominant-baseline='middle'
        font-family='system-ui,Segoe UI,Roboto' font-size='12' fill='#94A3B8'>No image</text>
    </svg>`
  );

const FALLBACK: BrandCard[] = Array.from({ length: 8 }).map((_, i) => ({
  id: `sk-${i}`,
  coverUrl: ph(),
  title: 'Đang cập nhật…',
}));

export default function FeaturedBrands({
  title = 'Thương hiệu nổi bật',
  items,
  fetchBrands,
  seeAllHref,
  className = '',
}: Props) {
  const [list, setList] = useState<BrandCard[]>(items ?? FALLBACK);
  const [loading, setLoading] = useState<boolean>(!!fetchBrands);

  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  // fetch nếu có API
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!fetchBrands) return;
      try {
        setLoading(true);
        const data = await fetchBrands();
        if (!cancelled && data?.length) setList(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchBrands]);

  const updateArrows = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 0);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };

  useEffect(() => {
    updateArrows();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateArrows);
    window.addEventListener('resize', updateArrows);
    return () => {
      el.removeEventListener('scroll', updateArrows);
      window.removeEventListener('resize', updateArrows);
    };
  }, [list.length]);

  const scrollByView = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: 'smooth' });
  };

  return (
    <section
      className={`rounded-2xl bg-gradient-to-r from-sky-50 to-indigo-50 p-4 ring-1 ring-slate-200 shadow-xl ${className}`}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        {seeAllHref && (
          <a
            href={seeAllHref}
            className="text-xs font-semibold text-sky-600 hover:underline"
          >
            Xem tất cả
          </a>
        )}
      </div>

      <div className="relative">
        {/* arrows */}
        <button
          aria-label="Prev"
          onClick={() => scrollByView(-1)}
          className="absolute left-0 top-1/2 -translate-y-1/2 ml-1 grid h-8 w-8 place-items-center
                         rounded-full bg-white/90 shadow ring-1 ring-slate-200 hover:bg-white text-sky-600"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" />
          </svg>
        </button>
        <button
          aria-label="Next"
          onClick={() => scrollByView(1)}
          className="absolute right-0 top-1/2 -translate-y-1/2 mr-1 grid h-8 w-8 place-items-center
                         rounded-full bg-white/90 shadow  ring-1 ring-slate-200 hover:bg-white text-sky-600"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" />
          </svg>
        </button>

        {/* scroller */}
        <div
          ref={scrollerRef}
          className="no-scrollbar flex gap-4 overflow-x-auto scroll-smooth px-1 py-2"
        >
          {list.map((b) => (
            <a
              key={b.id}
              href={b.href || '#'}
              className="w-[260px] shrink-0 rounded-2xl bg-white p-3 ring-1 ring-slate-200 shadow hover:shadow-md transition-shadow"
            >
              <div className="flex h-40 items-center justify-center overflow-hidden rounded-xl bg-slate-50">
                <img
                  src={b.coverUrl || ph()}
                  alt={b.title || ''}
                  className="max-h-full w-full object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = ph();
                  }}
                />
              </div>

              <div className="mt-3 flex items-center gap-2">
                {b.logoUrl && (
                  <img
                    src={b.logoUrl}
                    alt={b.title || 'logo'}
                    className="h-7 w-7 rounded object-contain"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.visibility =
                        'hidden';
                    }}
                  />
                )}
                <div className="text-xs font-semibold text-slate-900 line-clamp-1">
                  {b.title || ''}
                </div>
              </div>
              {b.tagline && (
                <div className="mt-1 text-[11px] text-slate-600 line-clamp-2">
                  {b.tagline}
                </div>
              )}
            </a>
          ))}
        </div>
      </div>

      {loading && <div className="mt-2 text-xs text-slate-500">Đang tải…</div>}
    </section>
  );
}
