import React, { useMemo, useState } from 'react';
import Stars from '../productDetail/Stars';
import { TIKI_RED } from '../productDetail/productDetail';

const vnd = (n?: number | string) =>
  Number(n ?? 0).toLocaleString('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 5,
  });

export default function Info({ product }: { product?: any }) {
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
    product?.variants?.[0]?.id ?? null
  );
  const [quantity, setQuantity] = useState(1);

  
  // Tính giá hiện tại theo variant + pricing_rules
  const price = useMemo(() => {
    if (!product) return 0;

    // 1. Giá cơ bản
    let currentPrice = Number(product.base_price ?? 0);

    // 2. Giá theo variant
    if (selectedVariantId) {
      const variant = product.variants?.find(
        (v: any) => v.id === selectedVariantId
      );
      if (variant) currentPrice = Number(variant.price);
    }

    // 3. Áp dụng pricing_rules nếu đủ điều kiện
    const now = new Date();
    const validRules = (product.pricing_rules ?? [])
      .filter((r: any) => {
        const start = r.starts_at ? new Date(r.starts_at) : new Date(0); // Default to epoch if null (always started)
        const end = r.ends_at
          ? new Date(r.ends_at)
          : new Date(8640000000000000); // Default to max date if null (never ends)
        const now = new Date();
        const ok = quantity >= r.min_quantity && now >= start && now <= end;
        return ok;
      })
      .sort((a: any, b: any) => b.min_quantity - a.min_quantity);

    if (validRules.length) currentPrice = Number(validRules[0].price);

    return currentPrice;
  }, [product, selectedVariantId, quantity]);

  const listPrice = useMemo(() => {
    if (!product) return 0;
    return Number(product.listPrice ?? product.base_price ?? 0);
  }, [product]);

  const discount = useMemo(() => {
    if (!price || !listPrice || listPrice <= price) return 0;
    return Math.round(((listPrice - price) / listPrice) * 100);
  }, [price, listPrice]);

  if (!product) return null;

  const rating = product.rating?.average ?? product.rating ?? 0;
  const reviewsCount = product.rating?.count ?? product.reviewsCount ?? 0;
  const brand = product.brand?.name ?? product.author_name ?? product.author;

  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
      {/* Tag */}
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded border border-emerald-500 px-2 py-[2px] font-medium text-emerald-600">
          30 NGÀY ĐỔI TRẢ
        </span>
        <span className="rounded border border-sky-500 px-2 py-[2px] font-medium text-sky-600">
          CHÍNH HÃNG
        </span>
        {brand && (
          <span className="text-slate-500">
            Thương hiệu:{' '}
            <a href="#" className="text-sky-700 hover:underline">
              {brand}
            </a>
          </span>
        )}
      </div>

      <h1 className="text-[22px] font-semibold leading-snug text-slate-900">
        {product.name || '—'}
      </h1>

      {/* Rating */}
      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
        <span className="flex items-center gap-1 text-slate-700">
          <Stars value={rating} />
          <span className="ml-1 text-slate-500">
            {rating} ({reviewsCount} đánh giá)
          </span>
        </span>
      </div>

      {/* Giá */}
      <div className="mt-3 flex items-end gap-3">
        <div
          className="text-[28px] font-bold leading-none"
          style={{ color: TIKI_RED }}
        >
          {vnd(price)}
        </div>
        {listPrice && listPrice !== price && (
          <div className="text-slate-400 line-through">{vnd(listPrice)}</div>
        )}
        {discount > 0 && (
          <span className="rounded-full bg-rose-50 px-2 py-[2px] text-sm font-semibold text-rose-600">
            -{discount}%
          </span>
        )}
      </div>

      {/* Chọn variant */}
      {product.variants?.length > 1 && (
        <div className="mt-3 flex gap-2">
          {product.variants.map((v: any) => (
            <button
              key={v.id}
              className={`px-3 py-1 border rounded ${
                v.id === selectedVariantId
                  ? 'border-blue-500 text-blue-600'
                  : 'border-gray-300'
              }`}
              onClick={() => setSelectedVariantId(v.id)}
            >
              {v.variant_name} ({vnd(v.price)})
            </button>
          ))}
        </div>
      )}

      {/* Chọn số lượng */}
      <div className="mt-2 flex items-center gap-2">
        <span>Số lượng:</span>
        <input
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="border px-2 py-1 rounded w-20"
        />
      </div>

      {/* Bảng giá sỉ */}
      {product.pricing_rules?.length > 0 && (
        <div className="mt-2 text-sm text-slate-500">
          <span className="font-medium">Giá sỉ:</span>{' '}
          {product.pricing_rules
            .sort((a: any, b: any) => a.min_quantity - b.min_quantity)
            .map((r: any) => {
              const start = new Date(r.starts_at ?? 0); // Default to epoch if null/undefined
              const end = new Date(r.ends_at ?? 8640000000000000); // Default to max date if null/undefined
              const now = new Date();
              const isApplied =
                quantity >= r.min_quantity && now >= start && now <= end;

              return (
                <span
                  key={r.min_quantity}
                  className={`ml-2 px-1 py-[1px] rounded ${
                    isApplied ? 'bg-rose-50 text-rose-600 font-semibold' : ''
                  }`}
                >
                  {r.min_quantity}+ : {vnd(r.price)}
                </span>
              );
            })}
        </div>
      )}
    </div>
  );
}
