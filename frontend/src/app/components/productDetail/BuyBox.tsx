// src/components/productDetail/BuyBox.tsx
import React, { useMemo } from 'react';
import { BadgeCheck } from 'lucide-react';
import { Product } from '../productDetail/product';
import { TIKI_RED } from '../productDetail/productDetail';
import { useNavigate } from 'react-router-dom';

export const vnd = (n?: number) =>
  (n ?? 0).toLocaleString('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  });

export default function BuyBox({
  product,
  width,
  minHeight,
  stickyTop,
  selectedVariantId,
  quantity,
  setQuantity,
  onBuyNow,
  onAddToCart,
}: {
  product?: Product;
  width?: number;
  minHeight?: number;
  stickyTop?: number;
  selectedVariantId?: number | null;
  quantity: number;
  setQuantity: React.Dispatch<React.SetStateAction<number>>;
  onBuyNow?: (p: {
    product?: Product;
    qty: number;
    variantId?: number | null;
  }) => void;
  onAddToCart?: (p: {
    product?: Product;
    qty: number;
    variantId?: number | null;
  }) => void;
}) {
  // --- tính giá dựa trên variant + pricing_rules ---
  const navigate = useNavigate();

  const price = useMemo(() => {
    if (!product) return 0;

    // 1. Giá cơ bản theo variant hoặc base_price
    let currentPrice = Number(product.base_price ?? 0);
    if (selectedVariantId) {
      const variant: any = product.variants?.find(
        (v: any) => v.id === selectedVariantId
      );
      if (variant) currentPrice = Number(variant.price);
    }

    // 2. Lấy rules từ product (không lấy từ variant)
    const rules: { min_qty: number; price: number }[] = (
      product.pricing_rules ?? []
    ).map((r: any) => ({
      min_qty: r.min_quantity,
      price: Number(r.price),
    }));

    // 3. Áp dụng rule dựa trên quantity
    if (rules.length > 0) {
      const matched = rules
        .filter((r) => quantity >= r.min_qty)
        .sort((a, b) => b.min_qty - a.min_qty)[0];
      if (matched) currentPrice = matched.price;
    }

    return currentPrice;
  }, [product, selectedVariantId, quantity]);

  if (!product) return null;

  const handleClickStore = () => {
    if (product.store?.slug) {
      navigate(`/stores/slug/${product.store.slug}`);
    }
  };

  return (
    <aside
      className="self-start h-fit rounded-2xl bg-white p-5 ring-1 ring-slate-200 lg:sticky"
      style={{ width, minHeight, top: stickyTop }}
    >
      {/* Seller info */}
      <div className="flex items-center gap-2 cursor-pointer" onClick={handleClickStore}>
        <img
          src={product.store?.logo_url ?? "https://via.placeholder.com/24"}
          className="h-6 w-6 rounded-full"
          alt={product.store?.name ?? "Store"}
        />
        <div>
          <div className="text-sm font-semibold">{product.store?.name ?? 'Official Store'}</div>
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <BadgeCheck className="h-4 w-4 text-sky-600" /> OFFICIAL • {(product.rating ?? 0).toFixed(1)}
          </div>
        </div>
      </div>

      {/* Quantity */}
      <div className="mt-5">
        <div className="text-xs text-slate-500">Số lượng</div>
        <div className="inline-flex items-center rounded-lg border border-slate-200">
          <button
            className="px-3 py-2 hover:bg-slate-50"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
          >
            -
          </button>
          <div className="w-10 text-center text-sm">{quantity}</div>
          <button
            className="px-3 py-2 hover:bg-slate-50"
            onClick={() => setQuantity(quantity + 1)}
          >
            +
          </button>
        </div>
      </div>

      {/* Price */}
      <div className="mt-4 text-sm text-slate-600">Tạm tính</div>
      <div className="text-[26px] font-bold">{vnd(price * quantity)}</div>

      {/* Actions */}
      <div className="mt-4 space-y-2">
        <button
          className="h-11 w-full rounded-xl px-4 text-base font-semibold text-white"
          style={{ background: TIKI_RED }}
          onClick={() =>
            onBuyNow?.({ product, qty: quantity, variantId: selectedVariantId })
          }
        >
          Mua ngay
        </button>
        <button
          className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-base font-semibold text-slate-700 hover:bg-slate-50"
          onClick={() => {
            if (product) {
              onAddToCart?.({ product, qty: quantity });
            }
          }}
        >
          Thêm vào giỏ
        </button>

        <button className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-700">
          Mua trước trả sau
        </button>
      </div>
    </aside>
  );
}
