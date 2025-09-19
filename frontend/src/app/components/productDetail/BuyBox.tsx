import React, { useState } from "react";
import { BadgeCheck } from "lucide-react";
import { Product } from "../productDetail/product";
import { TIKI_RED } from "../productDetail/productDetail";

const vnd = (n?: number) =>
  (n ?? 0).toLocaleString("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

export default function BuyBox({
  product,
  width,
  minHeight,
  stickyTop,
  onBuyNow,
  onAddToCart,
}: {
  product?: Product;
  width?: number;
  minHeight?: number;
  stickyTop?: number;
  onBuyNow?: (p: { product?: Product; qty: number }) => void;
  onAddToCart?: (p: { product?: Product; qty: number }) => void;
}) {
  const [qty, setQty] = useState(1);
  const p = product ?? {};

  return (
    <aside
      className="self-start h-fit rounded-2xl bg-white p-5 ring-1 ring-slate-200 lg:sticky"
      style={{ width, minHeight, top: stickyTop }}
    >
      <div className="flex items-center gap-2">
        <img
          src=""
          className="h-6 w-6"
          alt=""
        />
        <div>
          <div className="text-sm font-semibold">{p.sellerName }</div>
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <BadgeCheck className="h-4 w-4 text-sky-600" /> OFFICIAL • {(p.rating ?? 0).toFixed(1)}
          </div>
        </div>
      </div>

      <div className="mt-5">
        <div className="text-xs text-slate-500">Số lượng</div>
        <div className="inline-flex items-center rounded-lg border border-slate-200">
          <button className="px-3 py-2 hover:bg-slate-50" onClick={() => setQty(Math.max(1, qty - 1))}>-</button>
          <div className="w-10 text-center text-sm">{qty}</div>
          <button className="px-3 py-2 hover:bg-slate-50" onClick={() => setQty(qty + 1)}>+</button>
        </div>
      </div>

      <div className="mt-4 text-sm text-slate-600">Tạm tính</div>
      <div className="text-[26px] font-bold">{vnd((p.price ?? 0) * qty)}</div>

      <div className="mt-4 space-y-2">
        <button
          className="h-11 w-full rounded-xl px-4 text-base font-semibold text-white"
          style={{ background: TIKI_RED }}
          onClick={() => onBuyNow?.({ product: p, qty })}
        >
          Mua ngay
        </button>
        <button
          className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-base font-semibold text-slate-700 hover:bg-slate-50"
          onClick={() => onAddToCart?.({ product: p, qty })}
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
