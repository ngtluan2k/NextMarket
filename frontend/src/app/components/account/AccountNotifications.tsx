// src/components/account/AccountNotifications.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  Home,
  Gift,
  Receipt,
  RefreshCcw,
  MoreVertical,
  CheckCheck,
  Trash2,
} from 'lucide-react';

export type NotifyCategory = 'all' | 'promo' | 'order' | 'system';

export type NotificationItem = {
  id: string | number;
  title: string;
  body?: string;
  imageUrl?: string; // ảnh nhỏ bên trái (tùy chọn)
  type?: NotifyCategory; // dùng để client lọc nếu không gọi API theo tab
  createdAt?: string | number | Date;
  read?: boolean;
  link?: string; // click mở link (nếu có)
};

type Props = {
  /** Nếu có items, component dùng trực tiếp — không gọi fetch */
  items?: NotificationItem[];

  /** Hàm gọi API theo từng tab */
  fetchNotifications?: (
    category: NotifyCategory
  ) => Promise<NotificationItem[]>;

  /** Mở thông báo (ví dụ: mark read + navigate) */
  onOpenItem?: (n: NotificationItem) => void;

  /** Hành động menu 3 chấm */
  onMarkAllRead?: (cat: NotifyCategory) => void;
  onDeleteAll?: (cat: NotifyCategory) => void;

  /** Callback khi bấm “Tiếp tục mua sắm” */
  onContinue?: () => void;

  className?: string;
};

const TABS: { key: NotifyCategory; icon: React.ReactNode; label: string }[] = [
  { key: 'all', icon: <Home className="h-5 w-5" />, label: 'Tất cả' },
  { key: 'promo', icon: <Gift className="h-5 w-5" />, label: 'Khuyến mãi' },
  { key: 'order', icon: <Receipt className="h-5 w-5" />, label: 'Đơn hàng' },
  {
    key: 'system',
    icon: <RefreshCcw className="h-5 w-5" />,
    label: 'Hệ thống',
  },
];

export default function AccountNotifications({
  items,
  fetchNotifications,
  onOpenItem,
  onMarkAllRead,
  onDeleteAll,
  onContinue,
  className = '',
}: Props) {
  const [tab, setTab] = useState<NotifyCategory>('all');
  const [list, setList] = useState<NotificationItem[]>(items ?? []);
  const [loading, setLoading] = useState<boolean>(!!fetchNotifications);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  // gọi API khi đổi tab (nếu có fetcher)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!fetchNotifications) return;
      try {
        setLoading(true);
        const data = await fetchNotifications(tab);
        if (!cancelled) setList(Array.isArray(data) ? data : []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tab, fetchNotifications]);

  // nếu dùng props.items (không gọi API), lọc client theo tab
  const filtered = useMemo(() => {
    if (!items) return list;
    if (tab === 'all') return items;
    return items.filter((x) => x.type === tab);
  }, [tab, items, list]);

  return (
    <section
      className={`rounded-2xl bg-white ring-1 ring-slate-200 shadow ${className}`}
    >
      {/* header */}
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="text-base md:text-lg font-semibold text-slate-900">
          Thông báo của tôi
        </h2>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded-md p-2 hover:bg-slate-100 text-slate-600"
            aria-label="Menu"
          >
            <MoreVertical className="h-5 w-5" />
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg z-10"
              onMouseLeave={() => setMenuOpen(false)}
            >
              <button
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50"
                onClick={() => {
                  setMenuOpen(false);
                  onMarkAllRead?.(tab);
                }}
              >
                <CheckCheck className="h-4 w-4 text-slate-600" />
                Đánh dấu tất cả đã đọc
              </button>
              <button
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 text-rose-600"
                onClick={() => {
                  setMenuOpen(false);
                  onDeleteAll?.(tab);
                }}
              >
                <Trash2 className="h-4 w-4" />
                Xóa tất cả
              </button>
            </div>
          )}
        </div>
      </div>

      {/* tabs (icon row) */}
      <div className="flex items-center gap-6 border-b border-slate-200 px-3">
        {TABS.map((t) => {
          const active = t.key === tab;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative grid place-items-center h-12 w-12 rounded-md
                          ${
                            active
                              ? 'text-sky-600'
                              : 'text-slate-600 hover:bg-slate-50'
                          }`}
              title={t.label}
              aria-pressed={active}
            >
              {t.icon}
              {active && (
                <span className="absolute -bottom-[1px] left-0 right-0 h-[3px] rounded-t bg-sky-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* body */}
      <div className="p-4">
        {/* loading skeleton */}
        {loading && (
          <ul className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="flex gap-3">
                <div className="h-12 w-12 rounded-lg bg-slate-100 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-2/3 rounded bg-slate-100 animate-pulse" />
                  <div className="h-3 w-1/3 rounded bg-slate-100 animate-pulse" />
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* list */}
        {!loading && filtered.length > 0 && (
          <ul className="divide-y divide-slate-200">
            {filtered.map((n) => (
              <li key={n.id}>
                <button
                  className={`flex w-full gap-3 px-2 py-3 text-left hover:bg-slate-50 rounded-lg
                              ${!n.read ? 'bg-sky-50/40' : ''}`}
                  onClick={() => onOpenItem?.(n)}
                >
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100 grid place-items-center">
                    {n.imageUrl ? (
                      <img
                        src={n.imageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-6 w-6 rounded bg-slate-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-900 line-clamp-2">
                      {n.title}
                    </div>
                    {n.body && (
                      <div className="mt-0.5 text-[12px] text-slate-600 line-clamp-2">
                        {n.body}
                      </div>
                    )}
                    {n.createdAt && (
                      <div className="mt-1 text-[11px] text-slate-400">
                        {formatTime(n.createdAt)}
                      </div>
                    )}
                  </div>
                  {!n.read && (
                    <span className="mt-1 h-2 w-2 rounded-full bg-sky-500" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* empty state */}
        {!loading && filtered.length === 0 && (
          <div className="grid place-items-center py-14 text-center">
            <EmptyIllustration />
            <div className="mt-3 text-slate-600">Bạn chưa có thông báo</div>
            <button
              className="mt-4 rounded-lg bg-amber-400 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500"
              onClick={onContinue}
            >
              Tiếp tục mua sắm
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

/* ===== helpers ===== */

function formatTime(t: string | number | Date) {
  const d = new Date(t);
  if (Number.isNaN(+d)) return '';
  return d.toLocaleString('vi-VN');
}

function EmptyIllustration() {
  // Nhẹ, inline SVG tông xanh dương
  return (
    <svg width="110" height="110" viewBox="0 0 110 110" aria-hidden>
      <circle cx="55" cy="55" r="52" fill="#EAF6FF" />
      <circle cx="55" cy="50" r="20" fill="#00A6FF" />
      <rect x="35" y="70" width="40" height="16" rx="8" fill="#00A6FF" />
      <circle cx="55" cy="50" r="12" fill="#fff" />
    </svg>
  );
}
