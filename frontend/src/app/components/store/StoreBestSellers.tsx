import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export type BestSellerProduct = {
  id: string | number;
  name: string;
  imageUrl: string;
  rating: number;
  sold: number;
  price: number;
  discountPercent?: number;
  rank: number;
  badges?: string[];
  deliveryNote?: string;
};

type Props = {
  storeSlug: string;
  /** TUỲ CHỌN: nếu muốn override URL/fetch */
  fetchBestSellers?: (slug: string) => Promise<BestSellerProduct[]>;
};

export default function StoreBestSellers({ storeSlug, fetchBestSellers }: Props) {
  const [items, setItems] = useState<BestSellerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await (fetchBestSellers ?? defaultFetchBestSellers)(storeSlug);
        if (alive) setItems(Array.isArray(data) ? data.slice(0, 3) : []);
      } catch (e: any) {
        if (alive) setError(e?.message || "Không thể tải sản phẩm bán chạy");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [storeSlug, fetchBestSellers]);

  return (
    <section className="mt-3 rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-6">
        <h2 className="text-base font-semibold text-slate-900">Sản phẩm bán chạy nhất</h2>
        <Link to={`/store/${storeSlug}/bestsellers`} className="text-sm font-medium text-blue-600 hover:underline">
          Xem tất cả
        </Link>
      </div>

      <div className="px-4 py-4 sm:px-6">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-56 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
            Chưa có dữ liệu sản phẩm bán chạy.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {items.map((p) => (
              <div
                key={p.id}
                className="relative flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white p-3 transition hover:shadow-md"
              >
                <div
                  className={`absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white shadow-md ${
                    p.rank === 1 ? "bg-yellow-500" : p.rank === 2 ? "bg-blue-500" : "bg-orange-500"
                  }`}
                >
                  {p.rank}
                </div>

                <img src={p.imageUrl} alt={p.name} className="mx-auto h-36 object-contain" loading="lazy" />

                <div className="mt-2 flex-1">
                  <div className="line-clamp-2 text-sm font-medium text-slate-800">{p.name}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    ⭐ {p.rating} · Đã bán {p.sold.toLocaleString("vi-VN")}
                  </div>
                  <div className="mt-1 text-base font-semibold text-red-600">
                    {p.price.toLocaleString("vi-VN")} đ
                    {p.discountPercent ? (
                      <span className="ml-1 text-sm font-normal text-red-500">-{p.discountPercent}%</span>
                    ) : null}
                  </div>

                  {p.deliveryNote && (
                    <div className="mt-2 text-xs text-slate-600">{p.deliveryNote}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

async function defaultFetchBestSellers(slug: string): Promise<BestSellerProduct[]> {
  const res = await fetch(`/api/stores/${encodeURIComponent(slug)}/best-sellers`, {

  });
  const ct = res.headers.get("content-type") || "";
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`HTTP ${res.status}: ${t.slice(0, 120)}`);
  }
  if (!ct.includes("application/json")) {
    const t = await res.text();
    throw new Error("API trả về không phải JSON: " + t.slice(0, 120));
  }
  return res.json();
}
