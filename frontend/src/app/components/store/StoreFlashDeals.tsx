import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

export type FlashDealItem = {
  id: string | number;
  name: string;
  imageUrl: string;
  price: number;
  discountPercent?: number;
};

type Props = {
  storeSlug: string;
  /** thời điểm kết thúc đợt deal (ISO string từ BE) */
  endsAt?: string; // optional nếu BE không trả
  /** override fetcher nếu cần */
    items?: FlashDealItem[]; 
  fetchFlashDeals?: (
    slug: string
  ) => Promise<{ items: FlashDealItem[]; endsAt?: string }>;
  className?: string;
};

export default function StoreFlashDeals({
  storeSlug,
  endsAt,
  fetchFlashDeals,
  className,
}: Props) {
  const [items, setItems] = useState<FlashDealItem[]>([]);
  const [endTime, setEndTime] = useState<string | undefined>(endsAt);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const data = await (fetchFlashDeals ?? defaultFetchFlashDeals)(
          storeSlug
        );
        if (!alive) return;
        setItems(data.items || []);
        if (data.endsAt) setEndTime(data.endsAt);
      } catch (e: any) {
        if (alive) setErr(e?.message || 'Không thể tải flash deals');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [storeSlug, fetchFlashDeals]);

  // countdown
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const clock = useMemo(() => {
    if (!endTime) return null;
    const diff = Math.max(0, new Date(endTime).getTime() - now);
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(h)} : ${pad(m)} : ${pad(s)}`;
  }, [endTime, now]);

  const scrollBy = (dx: number) => {
    scrollerRef.current?.scrollBy({ left: dx, behavior: 'smooth' });
  };

  return (
    <section
      className={[
        'mt-3 rounded-2xl border border-slate-200 bg-white shadow-sm',
        className || '',
      ].join(' ')}
    >
      {/* header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-rose-600">
            Giá Sốc ⚡ Hôm Nay
          </h2>
          {clock && (
            <div className="flex items-center gap-1 text-[13px] font-semibold text-rose-600">
              {clock.split(':').map((seg, i) => (
                <span key={i} className="rounded-md bg-rose-50 px-1.5 py-0.5">
                  {seg.trim()}
                </span>
              ))}
            </div>
          )}
        </div>
        <Link
          to={`/store/${storeSlug}/deals`}
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          Xem tất cả
        </Link>
      </div>

      {/* list cuộn ngang */}
      <div className="relative">
        {/* arrows */}
        <button
          onClick={() => scrollBy(-320)}
          className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-slate-200 bg-white/90 px-2 py-1 shadow-sm hover:bg-white"
          aria-label="Prev"
        >
          ‹
        </button>
        <button
          onClick={() => scrollBy(320)}
          className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-slate-200 bg-white/90 px-2 py-1 shadow-sm hover:bg-white"
          aria-label="Next"
        >
          ›
        </button>

        <div
          ref={scrollerRef}
          className="no-scrollbar flex gap-4 overflow-x-auto px-4 py-4 sm:px-6"
        >
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-56 w-[200px] shrink-0 overflow-hidden rounded-lg border border-slate-200"
              >
                <div className="h-36 animate-pulse bg-slate-100" />
                <div className="space-y-2 p-3">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
                  <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
                </div>
              </div>
            ))
          ) : err ? (
            <div className="w-full rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {err}
            </div>
          ) : items.length === 0 ? (
            <div className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
              Chưa có deal hôm nay.
            </div>
          ) : (
            items.map((p) => (
              <div
                key={p.id}
                className="w-[200px] shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white p-3 text-center shadow-sm"
              >
                <img
                  src={p.imageUrl}
                  alt={p.name}
                  className="mx-auto h-36 object-contain"
                  loading="lazy"
                />
                <div className="mt-2 line-clamp-2 h-[2.6rem] text-sm text-slate-800">
                  {p.name}
                </div>
                <div className="mt-1 text-base font-semibold text-rose-600">
                  {p.price.toLocaleString('vi-VN')} đ
                  {p.discountPercent ? (
                    <span className="ml-2 rounded-md bg-rose-50 px-1.5 py-0.5 text-[11px] font-bold text-rose-600">
                      -{p.discountPercent}%
                    </span>
                  ) : null}
                </div>
                <div className="mt-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-3 py-1 text-[11px] font-medium text-rose-600">
                    <span className="h-2 w-2 rounded-full bg-rose-500" /> Vừa mở
                    bán
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

/** fetch mặc định: /api/stores/:slug/flash-deals  (trả { items, endsAt } ) */
async function defaultFetchFlashDeals(
  slug: string
): Promise<{ items: FlashDealItem[]; endsAt?: string }> {
  const res = await fetch(
    `/api/stores/${encodeURIComponent(slug)}/flash-deals`
  );
  const ct = res.headers.get('content-type') || '';
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`HTTP ${res.status}: ${t.slice(0, 120)}`);
  }
  if (!ct.includes('application/json')) {
    const t = await res.text();
    throw new Error('API không trả JSON: ' + t.slice(0, 120));
  }
  return res.json();
}
