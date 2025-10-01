import React from "react";
import { CardItem } from "../productDetail/product";
import { Image as ImageIcon } from "lucide-react";

const vnd = (n?: number) =>
  (n ?? 0).toLocaleString("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

export default function ComboStrip({ items }: any) {
  const list = items ?? [];
  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">Mua 3 Giảm 5%</h3>
        <a href="#" className="text-sm text-sky-700 hover:underline">Xem Thêm</a>
      </div>

      {!list.length ? (
        <div className="py-6 text-sm text-slate-600">Chưa có sản phẩm đề xuất.</div>
      ) : (
        <div className="mt-3 grid grid-flow-col auto-cols-[160px] gap-3 overflow-x-auto pb-2">
          {list.map((i, idx) => (
            <div key={i.id ?? idx} className="rounded-xl border border-slate-200 p-2">
              <div className="aspect-[3/4] overflow-hidden rounded bg-slate-50 grid place-items-center">
                {i.image ? (
                  <img src={i.image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon className="h-8 w-8 text-slate-300" />
                )}
              </div>
              <div className="mt-2 line-clamp-2 text-xs text-slate-700">{i.name || "—"}</div>
              <div className="mt-1 text-sm font-semibold">{vnd(i.price)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
