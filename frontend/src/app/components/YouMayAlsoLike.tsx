import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LikeItem } from '../types/product';

type Props = {
  title?: string;
  className?: string;
  skeletonCount?: number;
};

const ph = (w = 220, h = 220) =>
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>
       <rect width='100%' height='100%' rx='16' fill='#F1F5F9'/>
       <text x='50%' y='50%' text-anchor='middle' dominant-baseline='middle'
             font-family='system-ui,Segoe UI,Roboto' font-size='12' fill='#94A3B8'>No image</text>
     </svg>`
  );

const FALLBACK: LikeItem[] = Array.from({ length: 10 }).map((_, i) => ({
  id: `sk-${i}`,
  name: 'Đang cập nhật…',
  imageUrl: ph(),
}));

const toVND = (n: number | string | null | undefined) => {
  const num = typeof n === 'string' ? Number(n) : n ?? 0;
  if (!Number.isFinite(num)) return '—';
  return new Intl.NumberFormat('vi-VN').format(num) + 'đ';
};
export default function YouMayAlsoLikeProducts({
  title = 'Bạn có thể thích',
  className = '',
  skeletonCount = 10,
}: Props) {
  const [list, setList] = useState<LikeItem[]>(FALLBACK);
  const [loading, setLoading] = useState(true);

  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:3000/products', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        const data: any[] = await res.json();

        const mapped: LikeItem[] = data.map((p) => {
          const primaryMedia =
            p.media?.find((m: any) => m.is_primary) || p.media?.[0];
          const mainVariant = p.variants?.[0];
          const price = Number(mainVariant?.price || p.base_price || 0);
          const oldPrice =
            p.base_price && price < Number(p.base_price)
              ? Number(p.base_price)
              : undefined;
          const percentOff = oldPrice
            ? Math.round(((oldPrice - price) / oldPrice) * 100)
            : undefined;

          const buildImageUrl = (url?: string) => {
            if (!url) return ph();
            return url.startsWith('http')
              ? url
              : `http://localhost:3000/${url.replace(/^\/+/, '')}`;
          };

          return {
            id: p.id,
            name: p.name,
            imageUrl: buildImageUrl(primaryMedia?.url),
            price,
            oldPrice,
            percentOff,
            slug: p.slug,
          };
        });

        if (!cancelled) setList(mapped);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const update = () => {
      setCanPrev(el.scrollLeft > 0);
      setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', update);
      ro.disconnect();
    };
  }, [list]);

  const data = useMemo(() => (list.length ? list : FALLBACK), [list]);

  const scrollByCards = (dir: 'next' | 'prev') => {
    const el = scrollerRef.current;
    if (!el) return;
    const CARD = 184; // khớp chiều rộng card
    el.scrollBy({ left: dir === 'next' ? CARD * 3 : -CARD * 3, behavior: 'smooth' });
  };

  const goDetail = (slug?: string) => slug && navigate(`/products/slug/${slug}`);
  const buyNow = (slug?: string) =>
    slug && navigate(`/products/slug/${slug}?buyNow=1`);

  return (
    <section className={`rounded-2xl bg-white shadow-xl ring-1 ring-slate-200 p-4 ${className}`}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      </div>

      <div className="relative">
        <button
          aria-label="Trước"
          onClick={() => scrollByCards('prev')}
          disabled={!canPrev}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-full p-2 shadow-lg ring-1 ring-black/5
                     bg-sky-500 text-white hover:bg-sky-600 transition disabled:opacity-0 disabled:pointer-events-none"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <button
          aria-label="Sau"
          onClick={() => scrollByCards('next')}
          disabled={!canNext}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-full p-2 shadow-lg ring-1 ring-black/5
                     bg-sky-500 text-white hover:bg-sky-600 transition disabled:opacity-0 disabled:pointer-events-none"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div
          ref={scrollerRef}
          className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 no-scrollbar"
          style={{ scrollbarWidth: 'none' }}
        >
          {loading &&
            Array.from({ length: skeletonCount }).map((_, i) => (
              <div
                key={i}
                className="snap-start h-[320px] w-[184px] shrink-0 animate-pulse rounded-xl bg-slate-100"
              />
            ))}

          {data.map((p) => (
            <div
              key={p.id}
              className="snap-start h-[320px] w-[184px] shrink-0 cursor-pointer rounded-xl border border-slate-200 bg-white p-3
                         ring-1 ring-slate-100 hover:shadow-md transition-shadow flex flex-col"
              onClick={() => goDetail(p.slug)}
            >
              <div className="relative mb-2 h-[150px] rounded-lg bg-slate-50">
                {typeof p.percentOff === 'number' && isFinite(p.percentOff) && p.percentOff > 0 && (
                  <span className="absolute left-1 top-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-600 ring-1 ring-rose-100">
                    -{p.percentOff}%
                  </span>
                )}
                <img
                  src={p.imageUrl || ph()}
                  alt={p.name}
                  className="h-full w-full rounded-lg object-contain"
                  onError={(e) => {
                    const img = e.currentTarget as HTMLImageElement;
                    if (img.dataset.fallback !== '1') {
                      img.src = ph();
                      img.dataset.fallback = '1';
                    }
                  }}
                />
              </div>

              <h4
                className="min-h-[34px] text-xs text-slate-900 line-clamp-2"
                title={p.name}
              >
                {p.name}
              </h4>

              <div className="mt-1">
                {typeof p.price === 'number' && (
                  <div className="text-sm font-semibold text-rose-600">{toVND(p.price)}</div>
                )}
                <div className={`h-4 text-[11px] ${p.oldPrice ? 'text-slate-400 line-through' : 'invisible'}`}>
                  {p.oldPrice ? toVND(p.oldPrice) : '—'}
                </div>
              </div>

              {/* Nút mua ngay bám đáy card */}
              <button
                className="mt-auto w-full rounded-md bg-slate-900 px-2 py-1.5 text-[11px] font-medium text-white hover:bg-black/90"
                onClick={(e) => {
                  e.stopPropagation();
                  buyNow(p.slug);
                }}
              >
                Mua Ngay
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
