
import React, { useMemo, useState } from "react";
import Stars from "../productDetail/Stars";
import { TIKI_RED } from "../productDetail/productDetail";

const vnd = (n?: number | string) =>
  Number(n ?? 0).toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  });

export default function Info({ product }: { product?: any }) {
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
    product?.variants?.[0]?.id ?? null
  );
  const [quantity, setQuantity] = useState(1);

  // tính giá hiện tại theo variant + pricing rule
  const price = useMemo(() => {
    if (!product) return 0;

    let currentPrice = Number(product.base_price ?? 0);

    // 1. Lấy giá variant đã chọn
    if (selectedVariantId) {
      const variant = product.variants?.find((v: any) => v.id === selectedVariantId);
      if (variant) currentPrice = Number(variant.price);
    } else if (product.variants?.length) {
      currentPrice = Number(product.variants[0].price);
    }

    // 2. Kiểm tra pricing rules hợp lệ
    const now = new Date();
    const validRule = product.pricing_rules?.find((r: any) => {
      const start = new Date(r.starts_at);
      const end = new Date(r.ends_at);
      return quantity >= r.min_quantity && now >= start && now <= end;
    });

    if (validRule) currentPrice = Number(validRule.price);

    return currentPrice;
  }, [product, selectedVariantId, quantity]);

  // giá gốc (dùng base_price hoặc listPrice)
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
  const author = product.author_name ?? product.author;

  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded border border-emerald-500 px-2 py-[2px] font-medium text-emerald-600">
          30 NGÀY ĐỔI TRẢ
        </span>
        <span className="rounded border border-sky-500 px-2 py-[2px] font-medium text-sky-600">
          CHÍNH HÃNG
        </span>
        {author && (
          <span className="text-slate-500">
            Tác giả:{" "}
            <a href="#" className="text-sky-700 hover:underline">
              {author}
            </a>
          </span>
        )}
      </div>


      <h1 className="text-[22px] font-semibold leading-snug text-slate-900">
        {product.name || "—"}
      </h1>

      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
        <span className="flex items-center gap-1 text-slate-700">
          <Stars value={rating} />
          <span className="ml-1 text-slate-500">
            {rating} ({reviewsCount} đánh giá)
          </span>
        </span>
      </div>

      <div className="mt-3 flex items-end gap-3">
        <div className="text-[28px] font-bold leading-none" style={{ color: TIKI_RED }}>
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

      {/* Ví dụ chọn variant */}
      {product.variants?.length > 1 && (
        <div className="mt-3 flex gap-2">
          {product.variants.map((v: any) => (
            <button
              key={v.id}
              className={`px-3 py-1 border rounded ${
                v.id === selectedVariantId ? "border-blue-500 text-blue-600" : "border-gray-300"
              }`}
              onClick={() => setSelectedVariantId(v.id)}
            >
              {v.variant_name} ({vnd(v.price)})
            </button>
          ))}
        </div>
      )}

      {/* Ví dụ chọn số lượng */}
      <div className="mt-2">
        <input
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="border px-2 py-1 rounded w-20"
        />
      </div>
    </div>
  );
}