import React, { useMemo } from 'react';
import Stars from '../productDetail/Stars';
import { TIKI_RED, vnd } from '../../types/productDetail';
import { useNavigate } from 'react-router-dom';
import { VariantInfo } from '../../types/product';

export default function Info({
  product,
  selectedVariantId,
  setSelectedVariantId,
  quantity,
  setQuantity,
  calculatedPrice,
  maxQuantity,
}: {
  product?: any;
  selectedVariantId: number | null;
  setSelectedVariantId: (id: number) => void;
  quantity: number;
  setQuantity: (qty: number) => void;
  calculatedPrice: number;
  maxQuantity: number;
}) {
  const navigate = useNavigate();

  const stock = useMemo(() => {
    const v = product?.variants?.find(
      (v: VariantInfo) => v.id === selectedVariantId
    );
    return v?.stock ?? 0;
  }, [product, selectedVariantId]);

  const maxQty = Math.min(stock, maxQuantity);

  const listPrice = Number(product?.listPrice ?? product?.base_price ?? 0);
  const discount =
    listPrice > calculatedPrice
      ? Math.round(((listPrice - calculatedPrice) / listPrice) * 100)
      : 0;

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
        {brand?.name && (
          <span className="text-slate-500">
            Thương hiệu:{' '}
            <button
              type="button"
              onClick={() => navigate(`/brands/${brand.id ?? brand.name}`)}
              className="text-sky-700 hover:underline"
            >
              {brand}
            </button>
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
          {vnd(calculatedPrice)}
        </div>
        {listPrice && listPrice !== calculatedPrice && (
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
        <div className="mt-3 flex gap-2 flex-wrap">
          {product.variants.map((v: any) => (
            <button
              key={v.id}
              className={`px-3 py-1 border rounded ${
                v.id === selectedVariantId
                  ? 'border-blue-500 text-blue-600'
                  : 'border-gray-300'
              }`}
              onClick={() => setSelectedVariantId(v.id)}
              disabled={selectedVariantId === null}
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
          max={maxQty || 1}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="border px-2 py-1 rounded w-20"
        />
        {quantity === maxQty && maxQty > 0 && (
          <span className="px-2 py-0.5 text-xs rounded-full bg-rose-100 text-rose-700 font-medium">
            Đã đạt tối đa
          </span>
        )}
      </div>
      {/* Bảng giá sỉ */}
      {product.pricing_rules?.length > 0 && (
        <div className="mt-2 text-sm text-slate-500">
          <span className="font-medium">Giá sỉ:</span>{' '}
          {product.pricing_rules
            .sort((a: any, b: any) => a.min_quantity - b.min_quantity)
            .map((r: any) => {
              const start = new Date(r.starts_at ?? 0);
              const end = new Date(r.ends_at ?? 8640000000000000);
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
