import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Progress } from 'antd';
import { Flame } from 'lucide-react';
const DEBUG = true;

type ProductRaw = {
  id: number;
  slug?: string;
  name: string;
  media?: { url: string; is_primary?: boolean }[];
  base_price?: string | number;
  variants?: { price: string | number }[];
  brand?: { name: string };
  originalPrice?: string | number;
  pricing_rules?: {
    type: string;
    price: string | number;
    limit_quantity?: number;
    remaining_quantity?: number;
  }[];
};

export type ProductFlashSaleItem = {
  id: number;
  name: string;
  slug?: string;
  image: string;
  price: number;
  originalPrice?: number;
  brandName?: string;
  limitQuantity?: number;
  remainingQuantity?: number;
};

type ProductFlashSaleProps = {
  title?: string;
  seeAllHref?: string;
  className?: string;
  skeletonCount?: number;
};

const ph = (w = 220, h = 220) =>
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>
      <defs><linearGradient id='g' x1='0' x2='1'>
        <stop offset='0' stop-color='#E2E8F0' />
        <stop offset='1' stop-color='#F1F5F9' />
      </linearGradient></defs>
      <rect rx='12' width='100%' height='100%' fill='url(#g)'/>
      <text x='50%' y='50%' text-anchor='middle' dominant-baseline='middle'
        font-family='system-ui,Segoe UI,Roboto' font-size='12' fill='#94A3B8'>No image</text>
    </svg>`
  );
const BE_BASE_URL = import.meta.env.VITE_BE_BASE_URL;

function toImageUrl(url?: string) {
  if (!url) return ph();
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return `${BE_BASE_URL}/${url.replace(/^\/+/, '')}`;
}

function toNumber(v: unknown): number {
  if (typeof v === 'number') return isFinite(v) ? v : 0;
  if (typeof v === 'string') {
    const digits = v.replace(/[^\d]/g, '');
    return digits ? Number(digits) : 0;
  }
  return 0;
}

function formatVND(n: number) {
  if (!isFinite(n)) return '0đ';
  return new Intl.NumberFormat('vi-VN').format(n) + 'đ';
}

export default function ProductFlashSale({
  title = 'Flash Sale',
  seeAllHref = '/flash-sale',
  className = '',
  skeletonCount = 8,
}: ProductFlashSaleProps) {
  const [data, setData] = useState<ProductFlashSaleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const trackRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancel = false;

    (async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token') || '';
        const res = await fetch(`${BE_BASE_URL}/products/flash-sale`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        const raw = await res.json();

        if (DEBUG) {
          console.groupCollapsed('[FlashSale] raw response');
          console.log(raw);
          console.groupEnd();
        }

        // chấp nhận [] hoặc { data: [] }
        const arr: ProductRaw[] = Array.isArray(raw) ? raw : raw?.data ?? [];
        if (DEBUG) {
          console.groupCollapsed('[FlashSale] array extracted');
          console.log('length:', arr.length, 'preview[0]:', arr[0]);
          console.groupEnd();
        }

        const mapped: ProductFlashSaleItem[] = arr.map((p) => {
          const primaryMedia =
            p.media?.find((m) => m.is_primary) || p.media?.[0];
          const img = toImageUrl(primaryMedia?.url);

          // giá: ưu tiên variant đầu, sau đó base_price
          // ưu tiên flash_sale > variant đầu > base_price
          const flashSalePrice = p.pricing_rules?.find(
            (r) => r.type === 'flash_sale'
          )?.price;
          const price = toNumber(
            flashSalePrice ?? p.variants?.[0]?.price ?? p.base_price
          );
          const original = toNumber(p.base_price);

          const flashRule = p.pricing_rules?.find(
            (r) => r.type === 'flash_sale'
          );
          const limitQuantity = flashRule?.limit_quantity; // tổng số lượng tối đa
          const remainingQuantity = flashRule?.remaining_quantity; // số lượng còn lại

          const it: ProductFlashSaleItem = {
            id: p.id,
            slug: p.slug,
            name: p.name,
            image: img,
            price,
            originalPrice: original || undefined,
            brandName: p.brand?.name,
            limitQuantity,
            remainingQuantity,
          };

          if (DEBUG) {
            if (!p.name || !price) {
              console.warn('[FlashSale] mapped item suspicious:', {
                raw: p,
                mapped: it,
              });
            }
          }
          return it;
        });
        console.log(mapped);

        if (!cancel) setData(mapped);
      } catch (e) {
        console.error('[FlashSale] fetch error:', e);
        if (!cancel) setData([]);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();

    return () => {
      cancel = true;
    };
  }, []);

  const scrollByCards = (dir: number) => {
    const el = trackRef.current;
    if (!el) return;
    const CARD = 176;
    el.scrollBy({ left: dir * CARD * 3, behavior: 'smooth' });
  };

  const handleClick = (slug?: string) => {
    if (!slug) return;
    navigate(`/products/slug/${slug}`);
  };

  return (
    <section
      className={`rounded-2xl bg-white ring-1 ring-slate-200 shadow ${className}`}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          {title}

          {/* Nếu có sản phẩm flash sale => hiển thị chữ “Đang diễn ra” */}
          {data.length > 0 && (
            <span className="flex items-center gap-1 text-rose-600 text-xs font-medium animate-pulse">
              <Flame className="w-4 h-4 text-rose-500 animate-bounce" />
              Đang diễn ra
            </span>
          )}
        </h2>

        <Link to={seeAllHref} className="text-sm text-sky-600 hover:underline">
          Xem tất cả
        </Link>
      </div>

      <div className="relative px-2 pb-3">
        <div
          ref={trackRef}
          className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory no-scrollbar px-2 pb-2"
          style={{ scrollbarWidth: 'none' }}
        >
          <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>

          {loading &&
            Array.from({ length: skeletonCount }).map((_, i) => (
              <div
                key={i}
                className="snap-start w-[160px] shrink-0 animate-pulse rounded-xl bg-slate-100 h-[300px]"
              />
            ))}

          {!loading &&
            data.map((p) => {
              const hasOriginal =
                typeof p.originalPrice === 'number' && p.originalPrice > 0;
              const discount =
                hasOriginal && p.price > 0
                  ? Math.max(
                      0,
                      Math.min(
                        99,
                        Math.round(
                          (1 - p.price / (p.originalPrice as number)) * 100
                        )
                      )
                    )
                  : undefined;

              return (
                <div
                  key={p.id}
                  onClick={() => handleClick(p.slug)}
                  className="snap-start w-[160px] shrink-0 cursor-pointer rounded-xl bg-white
                  ring-1 ring-slate-200/70 shadow-sm transition hover:ring-slate-300
                  flex flex-col h-[250px] overflow-hidden"
                >
                  <div className="relative h-[120px] mb-2">
                    {typeof discount === 'number' && isFinite(discount) && (
                      <span className="absolute left-0 top-0 -translate-y-1.5 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-500 ring-1 ring-rose-100">
                        -{discount}%
                      </span>
                    )}
                    <img
                      loading="lazy"
                      src={p.image || ph()}
                      alt={p.name}
                      className="mx-auto block h-full w-[110px] rounded-lg object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = ph();
                      }}
                    />
                  </div>
                  <div className="flex flex-col flex-1">
                    <h3
                      className="text-sm font-medium leading-5"
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                      title={p.name}
                    >
                      {p.name}
                    </h3>

                    <div className="mt-2">
                      {p.originalPrice && p.originalPrice > p.price && (
                        <div className="text-[11px] text-slate-400 line-through mb-1">
                          {formatVND(p.originalPrice)}{' '}
                          {/* Giá gốc bị gạch ngang */}
                        </div>
                      )}
                      <div className="text-[13px] font-semibold text-rose-600">
                        {formatVND(p.price)} {/* Giá flash sale */}
                      </div>

                      {p.brandName && (
                        <div className="text-[11px] text-slate-400">
                          {p.brandName}
                        </div>
                      )}
                      {p.limitQuantity && p.remainingQuantity !== undefined && (
                        <div className="mt-3 relative">
                          <Progress
                            percent={
                              p.limitQuantity &&
                              p.remainingQuantity !== undefined
                                ? Math.max(
                                    0,
                                    (p.remainingQuantity / p.limitQuantity) *
                                      100
                                  )
                                : 100
                            }
                            showInfo={false}
                            strokeColor="#f43f5e"
                            trailColor="#fca5a5"
                            size={{ height: 15 }} // custom kích thước
                            className="mt-1.5"
                          />

                          <div className="absolute inset-0 flex items-center justify-center text-[10.5px] text-white font-medium pointer-events-none">
                            Còn lại: {p.remainingQuantity} sản phẩm
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        {data.length > 6 && (
          <>
            <button
              aria-label="Prev"
              onClick={() => scrollByCards(-1)}
              className="absolute left-0 top-1/2 -translate-y-1/2 ml-1 grid h-8 w-8 place-items-center rounded-full bg-white/90 shadow ring-1 ring-slate-200 hover:bg-white text-sky-600"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M15 18l-6-6 6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
            </button>
            <button
              aria-label="Next"
              onClick={() => scrollByCards(1)}
              className="absolute right-0 top-1/2 -translate-y-1/2 mr-1 grid h-8 w-8 place-items-center rounded-full bg-white/90 shadow ring-1 ring-slate-200 hover:bg-white text-sky-600"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" />
              </svg>
            </button>
          </>
        )}
      </div>
    </section>
  );
}
