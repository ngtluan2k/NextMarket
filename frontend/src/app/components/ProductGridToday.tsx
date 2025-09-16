import React, { useEffect, useMemo, useState } from "react";

export type Product = {
  id: string | number;
  name: string;
  thumbnailUrl: string;
  href?: string;
  price?: number | string;    // để trống được
  rating?: number;            // để trống được
  ratingCount?: number;       // để trống được
};

type FetchResult = Product[] | { items: Product[]; total?: number };

type Props = {
  title?: string;
  /** Client-side: truyền sẵn toàn bộ list. Server-side: bỏ trống và dùng fetchProducts */
  items?: Product[];
  /** Server-side: có thể nhận (page?, pageSize?) và trả về Product[] hoặc {items,total} */
  fetchProducts?: (page?: number, pageSize?: number) => Promise<FetchResult>;
  seeAllHref?: string;
  className?: string;
  pageSize?: number;
};

const ph = (w = 220, h = 220) =>
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>
       <rect width='100%' height='100%' rx='16' fill='#F1F5F9'/>
       <text x='50%' y='50%' text-anchor='middle' dominant-baseline='middle'
             font-family='system-ui,Segoe UI,Roboto' font-size='12' fill='#94A3B8'>No image</text>
     </svg>`
  );

const FALLBACK: Product[] = Array.from({ length: 15 }).map((_, i) => ({
  id: `sk-${i}`,
  name: "Đang cập nhật…",
  thumbnailUrl: ph(),
}));

function toResult(res?: FetchResult) {
  if (!res) return { items: [] as Product[], total: null as number | null };
  if (Array.isArray(res)) return { items: res, total: null as number | null };
  return { items: res.items ?? [], total: res.total ?? null };
}

export default function ProductGridToday({
  title = "Gợi ý hôm nay",
  items,
  fetchProducts,
  seeAllHref,
  className = "",
  pageSize = 15,
}: Props) {
  // list hiển thị hiện tại (server: đã gộp các trang; client: toàn bộ items)
  const [list, setList] = useState<Product[]>(items ?? FALLBACK);

  // server-side states
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState<number | null>(null);
  const [loadingInit, setLoadingInit] = useState<boolean>(!!fetchProducts);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [reachedEnd, setReachedEnd] = useState<boolean>(false);

  // Re-init khi đổi fetcher/pageSize
  useEffect(() => {
    let cancelled = false;

    // Client-side: dùng items có sẵn (hoặc FALLBACK nếu không có)
    if (!fetchProducts) {
      setList(items ?? FALLBACK);
      setPage(1);
      setTotal(null);
      setReachedEnd(false);
      setLoadingInit(false);
      return;
    }

    // Server-side: tải trang 1
    (async () => {
      try {
        setLoadingInit(true);
        setReachedEnd(false);
        setPage(1);
        setTotal(null);

        const res = await fetchProducts(1, pageSize);
        const { items: first, total: t } = toResult(res);
        if (cancelled) return;

        setList(first.length ? first : []);
        setTotal(t);

        // quyết định đã hết chưa
        const noMore = (first.length < pageSize) || (t != null && first.length >= t);
        setReachedEnd(noMore);
      } finally {
        if (!cancelled) setLoadingInit(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fetchProducts, pageSize, items]);

  // Client-side visible (cắt theo page)
  const visible = useMemo(() => {
    if (fetchProducts) return list; // server-side hiển thị toàn bộ list đã load
    return (list?.length ? list.slice(0, page * pageSize) : FALLBACK);
  }, [fetchProducts, list, page, pageSize]);

  const hasMore = fetchProducts ? !reachedEnd : list.length > visible.length;

  async function onLoadMore() {
    // Client-side: chỉ tăng page để cắt thêm
    if (!fetchProducts) {
      setPage((p) => p + 1);
      return;
    }

    // Server-side: gọi API trang kế
    if (reachedEnd || loadingMore) return;

    setLoadingMore(true);
    const next = page + 1;
    const prevLen = list.length;

    try {
      const res = await fetchProducts(next, pageSize);
      const { items: more, total: t } = toResult(res);

      // gộp dữ liệu
      const merged = [...list, ...(more ?? [])];
      setList(merged);
      setPage(next);
      if (t != null) setTotal(t);

      // tính đã hết chưa
      const newLen = prevLen + (more?.length ?? 0);
      const noMore = (more?.length ?? 0) < pageSize || (t != null && newLen >= t);
      if (noMore) setReachedEnd(true);
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <section className={`rounded-2xl bg-white shadow-xl ring-1 ring-slate-200 p-4 ${className}`}>
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        {seeAllHref && (
          <a href={seeAllHref} className="text-xs font-semibold text-sky-600 hover:underline">
            Xem tất cả
          </a>
        )}
      </div>

      {/* Grid (5 cột desktop) */}
      <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {visible.map((p) => (
          <li key={p.id} className="rounded-xl border border-slate-200 bg-white p-2 hover:shadow-md transition-shadow">
            <a href={p.href || "#"} className="block">
              <div className="rounded-lg bg-slate-50">
                <img
                  src={p.thumbnailUrl || ph()}
                  alt={p.name}
                  className="aspect-square w-full rounded-lg object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = ph();
                  }}
                />
              </div>

              <div className="mt-2 line-clamp-2 min-h-[34px] text-xs text-slate-900">{p.name}</div>

              {/* rating – chỉ hiện khi có */}
              {typeof p.rating === "number" && (
                <div className="mt-1 flex items-center gap-1">
                  <Stars value={p.rating} />
                  {typeof p.ratingCount === "number" && (
                    <span className="text-[10px] text-slate-500">({p.ratingCount})</span>
                  )}
                </div>
              )}

              {/* price – chỉ hiện khi có */}
              {p.price != null && (
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {typeof p.price === "number" ? p.price.toLocaleString("vi-VN") + "đ" : p.price}
                </div>
              )}
            </a>
          </li>
        ))}
      </ul>

      {/* Load more */}
      {hasMore && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={onLoadMore}
            disabled={loadingMore}
            className="rounded-md bg-slate-100 px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-60"
          >
            {loadingMore ? "Đang tải…" : "Xem thêm"}
          </button>
        </div>
      )}

      {/* trạng thái init cho server-side */}
      {loadingInit && <div className="mt-3 text-xs text-slate-500">Đang tải…</div>}
    </section>
  );
}

/* --- small star renderer --- */
function Stars({ value = 0 }: { value?: number }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <div className="flex items-center">
      {Array.from({ length: full }).map((_, i) => (
        <Star key={`f${i}`} type="full" />
      ))}
      {half && <Star type="half" />}
      {Array.from({ length: empty }).map((_, i) => (
        <Star key={`e${i}`} type="empty" />
      ))}
    </div>
  );
}

function Star({ type }: { type: "full" | "half" | "empty" }) {
  const fill = type === "empty" ? "none" : "#F59E0B";
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" className="inline-block">
      <defs>
        <linearGradient id="half-grad" x1="0" x2="1">
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="50%" stopColor="transparent" />
        </linearGradient>
      </defs>
      <path
        d="M10 1.5l2.7 5.47 6.03.88-4.36 4.25 1.03 6-5.4-2.84L4.6 18.1l1.03-6L1.27 7.85l6.03-.88L10 1.5z"
        stroke="#F59E0B"
        strokeWidth="1"
        fill={type === "half" ? "url(#half-grad)" : fill}
      />
    </svg>
  );
}
