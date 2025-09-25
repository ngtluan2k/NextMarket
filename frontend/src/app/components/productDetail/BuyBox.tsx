
// src/components/productDetail/BuyBox.tsx
import React, { useMemo } from 'react';
import { BadgeCheck } from 'lucide-react';
import { Product } from '../productDetail/product';
import { TIKI_RED } from '../productDetail/productDetail';
import { useCart } from '../../context/CartContext';

export const vnd = (n?: number) =>
  (n ?? 0).toLocaleString('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  });

export default function BuyBox({
  product,
  selectedVariantId,
  quantity,
  setQuantity,
  calculatedPrice,
  width,
  minHeight,
  stickyTop,
  onBuyNow,
  showMessage,
}: {
  product?: Product;
  selectedVariantId: number;
  quantity: number;
  setQuantity: (qty: number) => void;
  calculatedPrice: number;
  width?: number;
  minHeight?: number;
  stickyTop?: number;
  onBuyNow?: (p: { product?: Product; qty: number }) => void;
  showMessage?: (
    type: 'success' | 'error' | 'warning',
    content: string
  ) => void;
}) {
  const p = product ?? {};
  const { addToCart } = useCart();

  console.log(JSON.stringify(p));

  const handleAddToCart = async (product: Product, quantity: number) => {
    try {
      console.log('Adding to cart:', product.name, 'Quantity:', quantity);
      // Assuming addToCart can handle quantity; adjust if your context/API differs
      await addToCart(Number(product.id), quantity, selectedVariantId); // Pass quantity if supported
      if (showMessage) {
        showMessage('success', `${product.name} đã được thêm vào giỏ hàng`);
      }
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  };
  return (
    <aside
      className="self-start h-fit rounded-2xl bg-white p-5 ring-1 ring-slate-200 lg:sticky"
      style={{ width, minHeight, top: stickyTop }}
    >
      {/* Seller info */}
      <div className="flex items-center gap-2">
        <img
          src="https://via.placeholder.com/24"
          className="h-6 w-6 rounded-full"
          alt=""
        />
        <div>
          <div className="text-sm font-semibold">
            {p.store?.name ?? 'Official Store'}
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <BadgeCheck className="h-4 w-4 text-sky-600" /> OFFICIAL •{' '}
            {(p.rating ?? 0).toFixed(1)}
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
      <div className="text-[26px] font-bold">{vnd(calculatedPrice)}</div>


      {/* Actions */}
      <div className="mt-4 space-y-2">
        <button
          className="h-11 w-full rounded-xl px-4 text-base font-semibold text-white"
          style={{ background: TIKI_RED }}
          onClick={() => onBuyNow?.({ product: p, qty: quantity })}
        >
          Mua ngay
        </button>
        <button
          className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-base font-semibold text-slate-700 hover:bg-slate-50"
          onClick={() => handleAddToCart(p, quantity)}
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
