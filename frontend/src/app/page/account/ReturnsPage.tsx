// src/features/account/pages/ReturnsPage.tsx
import React, { useEffect, useState } from 'react';
import { RotateCcw, CheckCircle } from 'lucide-react';

/* ========= Types gom tại đây ========= */
export type ReturnTab = 'all' | 'in_progress' | 'done';

export type ReturnSummary = {
  id: string;
  code: string; // mã yêu cầu đổi trả (RMA)
  orderCode?: string; // mã đơn hàng liên quan
  status: ReturnTab;
  reason?: string;
  createdAt?: string | number | Date;
  updatedAt?: string | number | Date;
  items: Array<{ id: string; name: string; image?: string; qty: number }>;
};
/* ==================================== */

const TABS: { key: ReturnTab; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'in_progress', label: 'Đang tiến hành' },
  { key: 'done', label: 'Đã xong' },
];

export default function ReturnsPage() {
  const [tab, setTab] = useState<ReturnTab>('all');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [rows, setRows] = useState<ReturnSummary[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (tab !== 'all') params.set('status', tab);
        params.set('page', String(page));
        params.set('pageSize', '10');

        const res = await fetch(`/api/returns?${params.toString()}`, {
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Fetch returns failed');
        const data = (await res.json()) as {
          items: ReturnSummary[];
          hasMore?: boolean;
        };

        if (!cancelled) {
          setRows(
            page === 1
              ? data.items ?? []
              : (prev) => [...prev, ...(data.items ?? [])]
          );
          setHasMore(!!data.hasMore);
        }
      } catch {
        if (!cancelled) {
          setRows([]);
          setHasMore(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tab, page]);

  const statusPill = (s: ReturnTab) => {
    const base =
      'inline-flex items-center gap-1 rounded-full px-2 py-[2px] text-xs font-medium';
    if (s === 'in_progress')
      return (
        <span className={`${base} bg-sky-50 text-sky-700`}>
          <RotateCcw className="h-3 w-3" />
          Đang tiến hành
        </span>
      );
    if (s === 'done')
      return (
        <span className={`${base} bg-emerald-50 text-emerald-700`}>
          <CheckCircle className="h-3 w-3" />
          Đã xong
        </span>
      );
    return <span className={`${base} bg-slate-100 text-slate-700`}>—</span>;
  };

  return (
    <>
      <h1 className="text-2xl font-semibold text-slate-900 mb-4">
        Quản lý đổi trả
      </h1>

      <div className="rounded-2xl bg-white ring-1 ring-slate-200 shadow">
        {/* Tabs */}
        <div className="border-b border-slate-200 px-3 pt-2">
          <div className="flex flex-wrap gap-2">
            {TABS.map((t) => {
              const active = t.key === tab;
              return (
                <button
                  key={t.key}
                  onClick={() => {
                    setTab(t.key);
                    setPage(1);
                  }}
                  className={`px-3 py-2 text-sm rounded-t-md ${
                    active
                      ? 'text-sky-700 border-b-2 border-sky-600'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  aria-pressed={active}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="p-3">
          {/* Loading skeleton */}
          {loading && (
            <ul className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <li key={i} className="rounded-xl border border-slate-200 p-4">
                  <div className="h-4 w-40 bg-slate-100 rounded animate-pulse" />
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    {[0, 1, 2].map((k) => (
                      <div
                        key={k}
                        className="h-16 bg-slate-100 rounded animate-pulse"
                      />
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* List */}
          {!loading && rows.length > 0 && (
            <>
              <ul className="space-y-3">
                {rows.map((r) => (
                  <li
                    key={r.id}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm text-slate-700">
                        <span className="font-medium">Mã yêu cầu:</span>{' '}
                        {r.code}
                        {r.orderCode ? (
                          <span className="ml-3 text-slate-500">
                            Đơn: {r.orderCode}
                          </span>
                        ) : null}
                        {r.createdAt ? (
                          <span className="ml-3 text-slate-500">
                            {formatTime(r.createdAt)}
                          </span>
                        ) : null}
                      </div>
                      {statusPill(r.status)}
                    </div>

                    {/* Items */}
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {r.items.slice(0, 3).map((it) => (
                        <div key={it.id} className="flex gap-3">
                          <div className="h-14 w-14 overflow-hidden rounded bg-slate-100 ring-1 ring-slate-200">
                            {it.image ? (
                              <img
                                src={it.image}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : null}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm text-slate-900 line-clamp-2">
                              {it.name}
                            </div>
                            <div className="text-xs text-slate-500">
                              SL: {it.qty}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                      <div className="text-sm text-slate-600 line-clamp-1">
                        {r.reason ? (
                          <>
                            Lý do:{' '}
                            <span className="text-slate-900">{r.reason}</span>
                          </>
                        ) : (
                          <>&nbsp;</>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={`/account/returns/${r.id}`}
                          className="rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
                        >
                          Chi tiết
                        </a>
                        {r.status === 'in_progress' && (
                          <a
                            href={`/account/returns/${r.id}#messages`}
                            className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700"
                          >
                            Trao đổi
                          </a>
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
          {!loading && rows.length === 0 && (
            <div className="grid place-items-center py-14 text-center">
              <EmptyReturns />
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

/* ===== helpers ===== */
function formatTime(t: string | number | Date) {
  const d = new Date(t);
  return Number.isNaN(+d) ? '' : d.toLocaleString('vi-VN');
}

function EmptyReturns() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" aria-hidden>
      <circle cx="60" cy="60" r="56" fill="#F1F5F9" />
      <rect x="34" y="34" width="52" height="40" rx="6" fill="#CBD5E1" />
      <rect x="40" y="42" width="40" height="6" rx="3" fill="#FFF" />
      <rect x="40" y="52" width="28" height="6" rx="3" fill="#FFF" />
      <circle cx="70" cy="73" r="10" fill="#94A3B8" />
      <rect
        x="76"
        y="78"
        width="16"
        height="4"
        rx="2"
        transform="rotate(45 76 78)"
        fill="#94A3B8"
      />
    </svg>
  );
}
