import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { orderService } from '../../../service/order.service';
import CancelReasonModal from '../../components/account/CancelReasonModal';
import { Link } from 'react-router-dom';


const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

/** Chuẩn hoá path thô (Windows path, public/uploads, v.v.) về 'uploads/...' */
function normalizeRawPath(s: string) {
  let t = s.trim().replace(/\\/g, '/');

  // nếu là Windows/absolute path → cắt từ '/uploads/...'
  const m = /\/uploads\/[^?#]*/i.exec(t);
  if (m) t = t.slice(m.index + 1); // còn 'uploads/...'

  // bỏ prefix 'public/' hoặc 'static/' nếu có
  t = t.replace(/^\/?(public|static)\//i, '');

  // đảm bảo bắt đầu bằng 'uploads/'
  if (!/^uploads\//i.test(t)) t = `uploads/${t.replace(/^\/+/, '')}`;
  return t;
}

/** Ghép thành absolute URL dùng BE; giữ nguyên http(s) hoặc data: */
function toAbs(p?: string) {
  if (!p) return '';
  // 👇 CHỐT: chuẩn hoá slash TRƯỚC khi kiểm tra http(s)
  let s = String(p).trim().replace(/\\/g, '/');

  // nếu đã là absolute URL (sau khi đổi slash) hoặc data URL thì trả luôn
  if (/^https?:\/\//i.test(s) || /^data:image\//i.test(s)) return s;

  // absolute disk path (C:/..., file:/...) → cắt về 'uploads/...'
  if (/^[a-zA-Z]:\//.test(s) || s.startsWith('file:/')) {
    const idx = s.toLowerCase().lastIndexOf('/uploads/');
    if (idx >= 0) s = s.slice(idx + 1); // còn 'uploads/...'
  }

  // đảm bảo prefix uploads/
  if (!/^\/?uploads\//i.test(s)) s = `uploads/${s.replace(/^\/+/, '')}`;

  return `${API_BASE_URL}/${s.replace(/^\/+/, '')}`;
}

/** Lấy URL ảnh đầu tiên từ mọi kiểu media: string / JSON string / array / object */
function firstMediaUrl(media: any): string {
  if (!media) return '';

  if (typeof media === 'string') {
    try {
      const parsed = JSON.parse(media);
      if (Array.isArray(parsed) && parsed.length) {
        const m0 = parsed.find((x: any) => x?.is_primary) ?? parsed[0];
        const url = typeof m0 === 'string' ? m0 : (m0?.url ?? m0?.path ?? '');
        return url;
      }
      // string thường → trả nguyên
      return media;
    } catch {
      return media; // không phải JSON → coi như path/url
    }
  }

  if (Array.isArray(media) && media.length) {
    const m0 = media.find((x: any) => x?.is_primary) ?? media[0];
    return typeof m0 === 'string' ? m0 : (m0?.url ?? m0?.path ?? '');
  }

  if (typeof media === 'object') {
    return media?.url ?? media?.path ?? '';
  }

  return '';
}

/** Gom mọi khả năng có thể chứa ảnh của product/variant */
function getProductImage(prod: any, variant?: any): string {
  return (
    firstMediaUrl(prod?.media) ||
    prod?.thumbnail ||
    prod?.image ||
    prod?.image_url ||
    prod?.productMedia?.[0]?.url ||
    variant?.image ||
    ''
  );
}

/** Các trạng thái nội bộ cho tabs */
type OrderTab =
  | 'all'
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipping'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'returned';

function mapStatus(status: number): OrderTab {
  switch (status) {
    case 0:
      return 'pending'; // Pending
    case 1:
      return 'confirmed'; // Confirmed
    case 2:
      return 'processing'; // Processing
    case 3:
      return 'shipping'; // Shipped
    case 4:
      return 'delivered'; // Delivered
    case 5:
      return 'completed'; // Delivered
    case 6:
      return 'cancelled'; // Cancelled
    case 7:
      return 'returned'; // Returned
    default:
      return 'all';
  }
}

/** Kiểu dữ liệu gọn cho 1 đơn ở danh sách */
export type OrderSummary = {
  id: string;
  code: string;
  storeName?: string;
  status: OrderTab;
  createdAt?: string | number | Date;
  totalPrice?: number;
  items: Array<{
    id: string;
    name: string;
    image?: string;
    qty: number;
    price?: number;
  }>;
};

const TABS: { key: OrderTab; label: string }[] = [
  { key: 'all', label: 'Tất cả đơn' },
  { key: 'pending', label: 'Chờ thanh toán' },
  { key: 'confirmed', label: 'Đã xác nhận' },
  { key: 'processing', label: 'Đang xử lý' },
  { key: 'shipping', label: 'Đang vận chuyển' },
  { key: 'delivered', label: 'Đã giao' },
  { key: 'completed', label: 'Hoàn thành' },
  { key: 'cancelled', label: 'Đã huỷ' },
  { key: 'returned', label: 'Đã trả/Hoàn' },
];

const getUserIdFromStorage = (): number | null => {
  const raw = localStorage.getItem('user');
  if (!raw) return null;
  try {
    const user = JSON.parse(raw);
    return user.id ? Number(user.id) : null;
  } catch {
    return null;
  }
};

export default function OrdersPage() {
  const [tab, setTab] = useState<OrderTab>('all');
  const [q, setQ] = useState('');
  const [submittedQ, setSubmittedQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const userId = getUserIdFromStorage();
  const [cancelModalOrderId, setCancelModalOrderId] = useState<number | null>(
    null
  );

  

  // gọi API theo tab + q + page
  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        // Lấy dữ liệu từ backend
        const res = await orderService.getOrdersByUser(userId);

        // Map dữ liệu backend về OrderSummary
        const items: OrderSummary[] = (res as any[]).map((o) => ({
          id: String(o.id),
          code: o.uuid,
          storeName: o.store?.name ?? '',
          status: mapStatus(Number(o.status)),
          createdAt: o.createdAt,
          totalPrice: Number(o.totalAmount ?? 0),
          items: (o.orderItem ?? []).map((it: any) => {
            const rawImg = getProductImage(it.product, it.variant);
            const finalUrl = rawImg ? toAbs(rawImg) : '';
          
            // 👇 log 1 dòng cho mỗi item
            console.log('[ORDER IMG]', {
              orderId: o.id,
              itemId: it.id,
              rawImg,
              finalUrl,
              productMedia: it.product?.media,
              productMediaList: it.product?.productMedia,
            });
          
            return {
              id: String(it.id),
              name: it.product?.name ?? '',
              image: finalUrl,
              qty: it.quantity,
              price: Number(it.price ?? 0),
            };
          }),
        }));
        // Filter theo tab
        let filteredItems = items;
        if (tab !== 'all') {
          filteredItems = items.filter((o) => o.status === tab);
        }

        // Filter theo search
        if (submittedQ) {
          const qLower = submittedQ.toLowerCase();
          filteredItems = filteredItems.filter(
            (o) =>
              o.code.toLowerCase().includes(qLower) ||
              (o.storeName ?? '').toLowerCase().includes(qLower) || // fix ở đây
              o.items.some((it) => it.name.toLowerCase().includes(qLower))
          );
        }

        if (!cancelled) {
          setOrders(
            page === 1 ? filteredItems : (prev) => [...prev, ...filteredItems]
          );
          setHasMore(filteredItems.length >= 10);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Lỗi khi lấy đơn hàng:', err);
          setOrders([]);
          setHasMore(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tab, submittedQ, page, userId]);

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
    const base =
      'inline-flex items-center gap-1 rounded-full px-2 py-[2px] text-xs font-medium';
    switch (s) {
      case 'pending':
        return (
          <span className={`${base} bg-amber-50 text-amber-700`}>
            <Clock className="h-3 w-3" />
            Chờ thanh toán
          </span>
        );
      case 'confirmed':
        return (
          <span className={`${base} bg-blue-50 text-blue-700`}>
            <CheckCircle className="h-3 w-3" />
            Đã xác nhận
          </span>
        );
      case 'processing':
        return (
          <span className={`${base} bg-sky-50 text-sky-700`}>
            <Package className="h-3 w-3" />
            Đang xử lý
          </span>
        );
      case 'shipping':
        return (
          <span className={`${base} bg-indigo-50 text-indigo-700`}>
            <Truck className="h-3 w-3" />
            Đang vận chuyển
          </span>
        );
      case 'delivered':
        return (
          <span className={`${base} bg-emerald-50 text-emerald-700`}>
            <CheckCircle className="h-3 w-3" />
            Đã giao
          </span>
        );
      case 'completed':
        return (
          <span className={`${base} bg-emerald-50 text-emerald-700`}>
            <CheckCircle className="h-3 w-3" />
            Hoàn thành
          </span>
        );
      case 'cancelled':
        return (
          <span className={`${base} bg-rose-50 text-rose-700`}>
            <XCircle className="h-3 w-3" />
            Đã huỷ
          </span>
        );
      default:
        return <span className={`${base} bg-slate-100 text-slate-700`}>—</span>;
    }
  };

  return (
    <>
      <h1 className="text-2xl font-semibold text-slate-900 mb-4">
        Đơn hàng của tôi
      </h1>

      {/* Tabs */}
      <div className="rounded-2xl bg-white ring-1 ring-slate-200 shadow">
        <div className="border-b border-slate-200 px-3 pt-2">
          <div className="flex flex-wrap gap-2">
            {TABS.map((t) => {
              const active = t.key === tab;
              return (
                <button
                  key={t.key}
                  onClick={() => changeTab(t.key)}
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

        {/* Search row */}
        <form
          onSubmit={onSubmitSearch}
          className="flex items-center gap-2 px-3 py-3 border-b border-slate-200"
        >
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
                    {[0, 1, 2].map((k) => (
                      <div
                        key={k}
                        className="h-20 bg-slate-100 rounded animate-pulse"
                      />
                    ))}
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
                  <li
                    key={o.id}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm text-slate-700">
                        <span className="font-medium">Mã đơn:</span> {o.code}
                        {o.storeName ? (
                          <span className="ml-3 text-slate-500">
                            | {o.storeName}
                          </span>
                        ) : null}
                        {o.createdAt ? (
                          <span className="ml-3 text-slate-500">
                            {new Date(o.createdAt).toLocaleString('vi-VN')}
                          </span>
                        ) : null}
                      </div>
                      {statusPill(o.status)}
                    </div>

                    {/* Items (hiển thị tối đa 3 ảnh) */}
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {o.items?.slice(0, 3).map((it) => (
                        <div key={it.id} className="flex gap-3">
                          <div className="h-16 w-16 overflow-hidden rounded bg-slate-100 ring-1 ring-slate-200">
                          {it.image ? (
                            <img
                              src={it.image}
                              alt={it.name}
                              className="h-full w-full object-cover"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
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

                    {/* Footer: tổng tiền + hành động */}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                      <div className="text-sm text-slate-600">
                        Tổng tiền:{' '}
                        <span className="font-semibold text-slate-900">
                          {formatVND(o.totalPrice ?? 0)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                      <Link
                        to={`/account/orders/${o.id}`}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
                      >
                        Chi tiết
                      </Link>
                        {o.status === 'pending' && (
                          <a
                            href={`/checkout?orderId=${o.id}`}
                            className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-white hover:bg-amber-600"
                          >
                            Thanh toán
                          </a>
                        )}
                        {o.status === 'shipping' && (
                          <a
                            href={`/account/orders/${o.id}#tracking`}
                            className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700"
                          >
                            Theo dõi
                          </a>
                        )}
                        {o.status === 'delivered' && (
                          <a
                            href={`/account/orders/${o.id}#review`}
                            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                          >
                            Đánh giá
                          </a>
                        )}

                        {/* Nút Hủy đơn */}
                        {['pending', 'confirmed'].includes(o.status) && (
                          <button
                            onClick={() => setCancelModalOrderId(Number(o.id))}
                            className="rounded-lg bg-rose-500 px-3 py-2 text-sm font-medium text-white hover:bg-rose-600"
                          >
                            Hủy đơn
                          </button>
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
          {/* Modal hủy đơn */}
          {cancelModalOrderId && (
            <CancelReasonModal
              orderId={cancelModalOrderId}
              token={localStorage.getItem('token') || ''}
              onClose={() => setCancelModalOrderId(null)}
              onCancelled={() => {
                setCancelModalOrderId(null);
                setPage(1); // reset page
                setSubmittedQ((s) => s); // trigger useEffect load lại dữ liệu
              }}
            />
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
    return n.toLocaleString('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    });
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
