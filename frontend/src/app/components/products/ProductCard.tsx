import React from 'react';
import { Star } from 'lucide-react';

export type ProductItem = {
  id: string | number;
  name: string;
  imageUrl?: string;
  url?: string;
  price: number; // giá đang bán
  originalPrice?: number; // giá gốc
  rating?: number; // 0..5
  ratingCount?: number; // số lượng đánh giá
  badges?: string[]; // ví dụ: ["FREESHIP XTRA", "CHÍNH HÃNG"]
};

const ph = (w = 400, h = 300) =>
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>
      <rect width='100%' height='100%' rx='16' fill='#F1F5F9'/>
      <text x='50%' y='50%' text-anchor='middle' dominant-baseline='middle'
            font-family='system-ui,Segoe UI,Roboto' font-size='12' fill='#94A3B8'>No image</text>
    </svg>`
  );

function fmt(n?: number) {
  if (n == null) return '';
  return n.toLocaleString('vi-VN') + '₫';
}

function calcDiscount(price?: number, original?: number) {
  if (!price || !original || original <= 0 || price >= original)
    return undefined;
  const pct = Math.round(((original - price) / original) * 100);
  return `-${pct}%`;
}

export default function ProductCard({
  item,
  onAddToCart,
  className = '',
}: {
  item: ProductItem;
  onAddToCart?: (p: ProductItem) => void;
  className?: string;
}) {
  const {
    name,
    imageUrl,
    url,
    price,
    originalPrice,
    rating = 0,
    ratingCount = 0,
    badges = [],
  } = item;

  const discount = calcDiscount(price, originalPrice);

  return (
    <div
      className={`rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm p-3 ${className}`}
    >
      {/* Ảnh & badge % giảm */}
      <a href={url || '#'} className="block relative">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-slate-50">
          <img
            src={imageUrl || ph(400, 300)}
            alt={name}
            className="h-full w-full object-contain"
            onError={(e) =>
              ((e.currentTarget as HTMLImageElement).src = ph(400, 300))
            }
            loading="lazy"
          />
        </div>

        {discount && (
          <span className="absolute left-2 top-2 rounded-full bg-rose-500 px-2 py-0.5 text-[11px] font-semibold text-white">
            {discount}
          </span>
        )}
      </a>

      {/* Tên sản phẩm */}
      <a
        href={url || '#'}
        className="mt-2 block text-[13px] font-medium text-slate-900 hover:text-sky-700"
        title={name}
        // Fallback clamp nếu bạn không cài plugin line-clamp
        style={{
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {name}
      </a>

      {/* Giá */}
      <div className="mt-1 flex items-end gap-2">
        <div className="text-rose-600 font-semibold">{fmt(price)}</div>
        {originalPrice && originalPrice > price && (
          <div className="text-xs text-slate-400 line-through">
            {fmt(originalPrice)}
          </div>
        )}
      </div>

      {/* Rating */}
      <div className="mt-1 flex items-center gap-1 text-[12px] text-slate-600">
        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
        <span>{rating.toFixed(1)}</span>
        <span className="text-slate-400">/ 5</span>
        {!!ratingCount && (
          <span className="ml-1 text-slate-400">({ratingCount})</span>
        )}
      </div>

      {/* Badges */}
      {!!badges.length && (
        <div className="mt-2 flex flex-wrap gap-1">
          {badges.map((b, i) => (
            <span
              key={i}
              className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-[1px] text-[10px] font-medium text-slate-700"
            >
              {b}
            </span>
          ))}
        </div>
      )}

      {/* Hành động (tuỳ chọn) */}
      {onAddToCart && (
        <button
          onClick={() => onAddToCart(item)}
          className="mt-2 w-full rounded-lg bg-sky-600 py-2 text-sm font-semibold text-white hover:bg-sky-700"
        >
          Thêm vào giỏ
        </button>
      )}
    </div>
  );
}
