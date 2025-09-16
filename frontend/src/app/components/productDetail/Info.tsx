import React, { useMemo } from "react";
import Stars from "../productDetail/Stars";
import { Product } from "../productDetail/product";
import { TIKI_RED } from "../productDetail/productDetail";

const vnd = (n?: number) =>
  (n ?? 0).toLocaleString("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

export default function Info({ product }: { product?: Product }) {
  const p = product ?? {};
  const discount = useMemo(() => {
    const price = p.price ?? 0;
    const list = p.listPrice ?? 0;
    if (!price || !list || list <= price) return 0;
    return Math.round(((list - price) / list) * 100);
  }, [p.price, p.listPrice]);

  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded border border-emerald-500 px-2 py-[2px] font-medium text-emerald-600">30 NGÀY ĐỔI TRẢ</span>
        <span className="rounded border border-sky-500 px-2 py-[2px] font-medium text-sky-600">CHÍNH HÃNG</span>
        {p.author && (
          <span className="text-slate-500">
            Tác giả: <a href="#" className="text-sky-700 hover:underline">{p.author}</a>
          </span>
        )}
      </div>

      <h1 className="text-[22px] font-semibold leading-snug text-slate-900">{p.name || "—"}</h1>

      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
        <span className="flex items-center gap-1 text-slate-700">
          <Stars value={p.rating} />
          <span className="ml-1 text-slate-500">
            {p.rating ?? 0} ({p.reviewsCount ?? 0} đánh giá)
          </span>
        </span>
      </div>

      <div className="mt-3 flex items-end gap-3">
        <div className="text-[28px] font-bold leading-none" style={{ color: TIKI_RED }}>
          {vnd(p.price)}
        </div>
        {p.listPrice ? <div className="text-slate-400 line-through">{vnd(p.listPrice)}</div> : null}
        {discount > 0 && (
          <span className="rounded-full bg-rose-50 px-2 py-[2px] text-sm font-semibold text-rose-600">
            -{discount}%
          </span>
        )}
      </div>
    </div>
  );
}
