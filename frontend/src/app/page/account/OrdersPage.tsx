import React, { useEffect, useMemo, useState } from "react";
import { Search, Package, Truck, CheckCircle, XCircle, Clock } from "lucide-react";

/** Các trạng thái nội bộ cho tabs */
type OrderTab = "all" | "pending" | "processing" | "shipping" | "delivered" | "cancelled";

/** Kiểu dữ liệu gọn cho 1 đơn ở danh sách */
export type OrderSummary = {
  id: string;
  code: string;                  // Mã đơn
  sellerName?: string;
  status: OrderTab;              // map về các key ở trên
  createdAt?: string | number | Date;
  totalPrice?: number;
  items: Array<{ id: string; name: string; image?: string; qty: number; price?: number }>;
};

const TABS: { key: OrderTab; label: string }[] = [
  { key: "all",        label: "Tất cả đơn" },
  { key: "pending",    label: "Chờ thanh toán" },
  { key: "processing", label: "Đang xử lý" },
  { key: "shipping",   label: "Đang vận chuyển" },
  { key: "delivered",  label: "Đã giao" },
  { key: "cancelled",  label: "Đã huỷ" },
];

export default function OrdersPage() {
  const [tab, setTab] = useState<OrderTab>("all");
  const [q, setQ] = useState("");
  const [submittedQ, setSubmittedQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [orders, setOrders] = useState<OrderSummary[]>([]);

  // gọi API theo tab + q + page
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (tab !== "all") params.set("status", tab);      // server map: pending|processing|shipping|delivered|cancelled
        if (submittedQ) params.set("q", submittedQ);
        params.set("page", String(page));
        params.set("pageSize", "10");

        const res = await fetch(`/api/orders?${params.toString()}`, { credentials: "include" });
        if (!res.ok) throw new Error("Fetch orders failed");
        const data = await res.json() as { items: OrderSummary[]; hasMore?: boolean };

        if (!cancelled) {
          setOrders(page === 1 ? (data.items || []) : (prev) => [...prev, ...(data.items || [])]);
          setHasMore(!!data.hasMore);
        }
      } catch {
        if (!cancelled) {
          setOrders([]);
          setHasMore(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [tab, submittedQ, page]);

  // đổi tab => reset trang & dữ liệu
  const changeTab = (t: OrderTab) => {
    setTab(t);
    setPage(1);
    setSubmittedQ((s) => s); // giữ nguyên search hiện tại
  };

  const onSubmitSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    setPage(1);
    setSubmittedQ(q.trim());
  };

  const statusPill = (s: OrderTab) => {
    const base = "inline-flex items-center gap-1 rounded-full px-2 py-[2px] text-xs font-medium";
    switch (s) {
      case "pending":   return <span className={`${base} bg-amber-50 text-amber-700`}><Clock className="h-3 w-3"/>Chờ thanh toán</span>;
      case "processing":return <span className={`${base} bg-sky-50 text-sky-700`}><Package className="h-3 w-3"/>Đang xử lý</span>;
      case "shipping":  return <span className={`${base} bg-indigo-50 text-indigo-700`}><Truck className="h-3 w-3"/>Đang vận chuyển</span>;
      case "delivered": return <span className={`${base} bg-emerald-50 text-emerald-700`}><CheckCircle className="h-3 w-3"/>Đã giao</span>;
      case "cancelled": return <span className={`${base} bg-rose-50 text-rose-700`}><XCircle className="h-3 w-3"/>Đã huỷ</span>;
      default:          return <span className={`${base} bg-slate-100 text-slate-700`}>—</span>;
    }
  };

  return (
    <>
      <h1 className="text-2xl font-semibold text-slate-900 mb-4">Đơn hàng của tôi</h1>

      {/* Tabs */}
      <div className="rounded-2xl bg-white ring-1 ring-slate-200 shadow">
        <div className="border-b border-slate-200 px-3 pt-2">
          <div className="flex flex-wrap gap-2">
            {TABS.map(t => {
              const active = t.key === tab;
              return (
                <button
                  key={t.key}
                  onClick={() => changeTab(t.key)}
                  className={`px-3 py-2 text-sm rounded-t-md ${
                    active
                      ? "text-sky-700 border-b-2 border-sky-600"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  aria-pressed={active}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search row */}
        <form onSubmit={onSubmitSearch} className="flex items-center gap-2 px-3 py-3 border-b border-slate-200">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
              placeholder="Tìm đơn hàng theo Mã đơn hàng, Nhà bán hoặc Tên sản phẩm"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
          >
            Tìm đơn hàng
          </button>
        </form>

        {/* Body */}
        <div className="p-3">
          {/* Loading skeleton */}
          {loading && (
            <ul className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <li key={i} className="rounded-xl border border-slate-200 p-4">
                  <div className="h-4 w-40 bg-slate-100 rounded animate-pulse" />
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    {[0,1,2].map((k) => <div key={k} className="h-20 bg-slate-100 rounded animate-pulse" />)}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* List */}
          {!loading && orders.length > 0 && (
            <>
              <ul className="space-y-3">
                {orders.map((o) => (
                  <li key={o.id} className="rounded-xl border border-slate-200 p-4">
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm text-slate-700">
                        <span className="font-medium">Mã đơn:</span> {o.code}
                        {o.sellerName ? <span className="ml-3 text-slate-500">| {o.sellerName}</span> : null}
                        {o.createdAt ? <span className="ml-3 text-slate-500">{new Date(o.createdAt).toLocaleString("vi-VN")}</span> : null}
                      </div>
                      {statusPill(o.status)}
                    </div>

                    {/* Items (hiển thị tối đa 3 ảnh) */}
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {o.items.slice(0, 3).map(it => (
                        <div key={it.id} className="flex gap-3">
                          <div className="h-16 w-16 overflow-hidden rounded bg-slate-100 ring-1 ring-slate-200">
                            {it.image ? <img src={it.image} alt="" className="h-full w-full object-cover" /> : null}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm text-slate-900 line-clamp-2">{it.name}</div>
                            <div className="text-xs text-slate-500">SL: {it.qty}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Footer: tổng tiền + hành động */}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                      <div className="text-sm text-slate-600">
                        Tổng tiền: <span className="font-semibold text-slate-900">{formatVND(o.totalPrice ?? 0)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <a href={`/account/orders/${o.id}`} className="rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50">Chi tiết</a>
                        {o.status === "pending" && (
                          <a href={`/checkout?orderId=${o.id}`} className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-white hover:bg-amber-600">Thanh toán</a>
                        )}
                        {o.status === "shipping" && (
                          <a href={`/account/orders/${o.id}#tracking`} className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700">Theo dõi</a>
                        )}
                        {o.status === "delivered" && (
                          <a href={`/account/orders/${o.id}#review`} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700">Đánh giá</a>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {hasMore && (
                <div className="mt-4 grid place-items-center">
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50"
                  >
                    Tải thêm
                  </button>
                </div>
              )}
            </>
          )}

          {/* Empty */}
          {!loading && orders.length === 0 && (
            <div className="grid place-items-center py-14 text-center">
              <EmptyOrders />
              <div className="mt-3 text-slate-600">Chưa có đơn hàng</div>
              <a
                href="/"
                className="mt-4 inline-block rounded-lg bg-amber-400 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500"
              >
                Tiếp tục mua sắm
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ===== Helpers ===== */

function formatVND(n: number) {
  try {
    return n.toLocaleString("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });
  } catch {
    return `${n}₫`;
  }
}

function EmptyOrders() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" aria-hidden>
      <circle cx="60" cy="60" r="56" fill="#F1F5F9" />
      <rect x="34" y="34" width="52" height="40" rx="6" fill="#CBD5E1" />
      <rect x="40" y="42" width="40" height="6" rx="3" fill="#FFF" />
      <rect x="40" y="52" width="28" height="6" rx="3" fill="#FFF" />
      <circle cx="70" cy="73" r="10" fill="#94A3B8" />
      <rect x="76" y="78" width="16" height="4" rx="2" transform="rotate(45 76 78)" fill="#94A3B8" />
    </svg>
  );
}
