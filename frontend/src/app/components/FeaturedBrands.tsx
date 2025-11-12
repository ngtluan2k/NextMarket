import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const DEBUG = true;

export type BrandCard = {
  id: string | number;
  name?: string; // hiển thị bằng name
  coverUrl?: string;
  logoUrl?: string;
  tagline?: string;
  href?: string;
};

type Props = {
  title?: string;
  items?: BrandCard[];
  fetchBrands?: () => Promise<any>; // có thể [] | {data:[]} | BrandCard[]
  seeAllHref?: string;
  className?: string;
  onSelect?: (brand: BrandCard) => void;
  /** URL fallback để auto fetch khi phát hiện adapter mất "name" */
  apiUrl?: string;
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
const BE_BASE_URL = import.meta.env.VITE_BE_BASE_URL;

const toImageUrl = (url?: string) => {
  if (!url) return ph();
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return `${BE_BASE_URL}${url}`;
};

const normalizeBrand = (b: any): BrandCard => {
  const id = b?.id ?? b?.uuid ?? '';
  const name = b?.name ?? b?.title ?? ''; // nhận cả title nếu adapter dùng title
  const description = b?.description ?? b?.tagline ?? '';
  const logo = b?.logoUrl ?? b?.logo_url ?? '';
  const cover = b?.coverUrl ?? b?.cover_url ?? b?.logo_url ?? '';
  const nb: BrandCard = {
    id,
    name: name || '—',
    tagline: description,
    logoUrl: toImageUrl(logo),
    coverUrl: toImageUrl(cover),
    href: b?.href ?? (id ? `/brands/${id}` : undefined),
  };
  if (DEBUG && !name) {
    console.warn(
      '[FeaturedBrands] normalizeBrand: missing name/title in item:',
      b
    );
  }
  return nb;
};

const FALLBACK: BrandCard[] = Array.from({ length: 8 }).map((_, i) => ({
  id: `sk-${i}`,
  name: 'Đang cập nhật…',
  coverUrl: ph(),
}));

export default function FeaturedBrands({
  title = 'Thương hiệu nổi bật',
  items,
  fetchBrands,
  seeAllHref,
  className = '',
  onSelect,
  apiUrl = `${BE_BASE_URL}/brands`,
}: Props) {
  const [list, setList] = useState<BrandCard[]>(
    items && items.length ? items.map(normalizeBrand) : FALLBACK
  );
  const [loading, setLoading] = useState<boolean>(!!fetchBrands);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const navigate = useNavigate();

  // items -> normalize + log
  useEffect(() => {
    if (items && items.length) {
      const normalized = items.map(normalizeBrand);
      if (DEBUG) {
        console.groupCollapsed('[FeaturedBrands] props.items normalized');
        console.table(normalized.map(({ id, name }) => ({ id, name })));
        console.groupEnd();
      }
      setList(normalized);
    }
  }, [items]);

  // fetch + auto-fallback nếu adapter mất "name"
  useEffect(() => {
    let cancelled = false;

    const apply = (arr: any[], tag: string) => {
      const mapped = arr.map(normalizeBrand);
      if (!cancelled) setList(mapped);
      return mapped;
    };

    (async () => {
      if (!fetchBrands) return;
      try {
        setLoading(true);
        const raw = await fetchBrands();
        if (DEBUG) {
          console.groupCollapsed('[FeaturedBrands] fetchBrands() raw');
          console.log(raw);
          console.groupEnd();
        }
        const arr: any[] = Array.isArray(raw) ? raw : raw?.data ?? [];
        const mapped = apply(arr, 'adapter result');

        // ⛑ Fallback: nếu tất cả item đều name="—" (tức adapter mất name), tự fetch từ API gốc
        if (mapped.length && mapped.every((it) => it.name === '—')) {
          console.warn(
            '[FeaturedBrands] All names are "—" → Adapter likely dropped `name`. Falling back to direct API:',
            apiUrl
          );
          try {
            const res = await fetch(apiUrl);
            const json = await res.json();
            const arr2: any[] = Array.isArray(json) ? json : json?.data ?? [];
            apply(arr2, 'fallback API result');
          } catch (e) {
            console.error('[FeaturedBrands] Fallback API fetch failed:', e);
          }
        }
      } catch (err) {
        console.error('[FeaturedBrands] fetch error:', err);
        if (!cancelled) setList([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fetchBrands, apiUrl]);

  // log mỗi lần list đổi
  useEffect(() => {
    if (!DEBUG) return;
    console.groupCollapsed('[FeaturedBrands] list updated');
    console.table(list.map(({ id, name }) => ({ id, name })));
    console.groupEnd();
  }, [list]);

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

  const handleClickBrand = (b: BrandCard) => {
    onSelect?.(b);
    if (b.id != null) navigate(`/brands/${b.id}`);
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
          disabled={!canLeft}
          className={`absolute left-0 top-1/2 -translate-y-1/2 ml-1 grid h-8 w-8 place-items-center rounded-full bg-white/90 shadow ring-1 ring-slate-200 hover:bg-white text-sky-600 ${
            !canLeft ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" />
          </svg>
        </button>
        <button
          aria-label="Next"
          onClick={() => scrollByView(1)}
          disabled={!canRight}
          className={`absolute right-0 top-1/2 -translate-y-1/2 mr-1 grid h-8 w-8 place-items-center rounded-full bg-white/90 shadow ring-1 ring-slate-200 hover:bg-white text-sky-600 ${
            !canRight ? 'opacity-50 cursor-not-allowed' : ''
          }`}
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
          {list.map((b) => {
            const displayName = b.name || '—';
            return (
              <div
                key={b.id}
                className="w-[260px] shrink-0 rounded-2xl bg-white p-3 ring-1 ring-slate-200 shadow hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleClickBrand(b)}
              >
                <div className="flex h-40 items-center justify-center overflow-hidden rounded-xl bg-slate-50">
                  <img
                    src={b.coverUrl || ph()}
                    alt={displayName}
                    className="max-h-full w-full object-contain"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = ph();
                      if (DEBUG)
                        console.warn(
                          '[FeaturedBrands] image load error → fallback placeholder'
                        );
                    }}
                  />
                </div>

                <div className="mt-3 flex items-center gap-2">
                  {/* {b.logoUrl && (
                    <img
                      src={b.logoUrl}
                      alt={displayName || 'logo'}
                      className="h-7 w-7 rounded object-contain"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.visibility = 'hidden';
                        if (DEBUG) console.warn('[FeaturedBrands] logo image error → hide element');
                      }}
                    />
                  )} */}
                  <div className="text-xs font-semibold text-slate-900 line-clamp-1">
                    {displayName}
                  </div>
                </div>

                {b.tagline && (
                  <div className="mt-1 text-[11px] text-slate-600 line-clamp-2">
                    {b.tagline}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {loading && <div className="mt-2 text-xs text-slate-500">Đang tải…</div>}
      {!loading && !list.length && (
        <div className="mt-2 text-xs text-slate-500">Chưa có thương hiệu.</div>
      )}
    </section>
  );
}
