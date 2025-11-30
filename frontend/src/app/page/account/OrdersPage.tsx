// src/pages/account/OrdersPage.tsx
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
import ReviewModal from '../../components/account/ReviewModal';
import { Link, useNavigate } from 'react-router-dom';

/** Các trạng thái nội bộ cho tabs */
type OrderTab =
  | 'all'
  | 'waiting_group'
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
    case -1:
      return 'waiting_group';
    case 0:
      return 'pending';
    case 1:
      return 'confirmed';
    case 2:
      return 'processing';
    case 3:
      return 'shipping';
    case 4:
      return 'delivered';
    case 5:
      return 'completed';
    case 6:
      return 'cancelled';
    case 7:
      return 'returned';
    default:
      return 'all';
  }
}

/** Kiểu dữ liệu gọn cho 1 đơn ở danh sách */
export type OrderSummary = {
  id: string;
  code: string;
  storeName?: string;
  storeSlug?: string;
  status: OrderTab;
  createdAt?: string | number | Date;
  totalPrice?: number;
  groupOrderId?: number | null;
  payment?: Array<{
    id: number;
    status: number; // 0: Unpaid, 1: Paid, 2: Failed, 3: Refunded
    amount?: number;
    paidAt?: string | Date;
    paymentMethod?: {
      id: number;
      name: string;
      type: string;
    };
  }>;
  items: Array<{
    productId?: number;
    id: string;
    name: string;
    image?: string;
    qty: number;
    price?: number;
    isReviewed?: boolean;
    reviewId?: number | null;
  }>;
  orderItem?: Array<{
    id: string;
    quantity: number;
    pricing_rule_id?: number | null;
    product?: {
      id: number;
      slug: string;
      name: string;
      media?: Array<{ url: string; is_primary: boolean }>;
      reviews?: Array<{
        id: number;
        user: { id: number };
        order: { id: string | number };
      }>;
    };
  }>;
};

const BE_BASE_URL = import.meta.env.VITE_BE_BASE_URL;

const TABS: { key: OrderTab; label: string }[] = [
  { key: 'all', label: 'Tất cả đơn' },
  { key: 'waiting_group', label: 'Chờ nhóm' },
  { key: 'pending', label: 'Chờ thanh toán' },
  { key: 'confirmed', label: 'Đã xác nhận' },
  { key: 'processing', label: 'Đang xử lý' },
  { key: 'shipping', label: 'Đang vận chuyển' },
  { key: 'delivered', label: 'Đã giao' },
  { key: 'completed', label: 'Hoàn thành' },
  { key: 'cancelled', label: 'Đã huỷ' },
  { key: 'returned', label: 'Đã trả/Hoàn' },
];

const PAGE_SIZE = 5; 

const getUserIdFromStorage = (): number | null => {
  const raw = localStorage.getItem('user');
  if (!raw) return null;
  try {
    const user = JSON.parse(raw);
    return user.user_id ? Number(user.user_id) : null;
  } catch {
    return null;
  }
};

export default function OrdersPage() {
  const [tab, setTab] = useState<OrderTab>('all');

  const [selectedReviewId, setSelectedReviewId] = useState<number | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null
  );

  const [openReview, setOpenReview] = useState(false);
  const [q, setQ] = useState('');
  const [submittedQ, setSubmittedQ] = useState('');
  const [loading, setLoading] = useState(true);

  // ❗ rawOrders: tất cả đơn lấy từ backend
  const [rawOrders, setRawOrders] = useState<OrderSummary[]>([]);

  const [page, setPage] = useState(1); // trang hiện tại
  const userId = getUserIdFromStorage();
  const [cancelModalOrderId, setCancelModalOrderId] = useState<number | null>(
    null
  );
  const navigate = useNavigate();

  // ===== GỌI API, chỉ fetch 1 lần theo userId =====
  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const res = await orderService.getOrderByUser(userId);

        const items: OrderSummary[] = (res as any[]).map((o) => ({
          id: String(o.id),
          code: o.uuid,
          storeName: o.store?.name ?? '',
          storeSlug: o.store?.slug ?? '',
          status: mapStatus(Number(o.status)),
          createdAt: o.createdAt,
          totalPrice: Number(o.totalAmount ?? 0),
          groupOrderId: o.group_order_id ?? null,
          payment: o.payment
            ? Array.isArray(o.payment)
              ? o.payment
              : [o.payment]
            : undefined,
          items: (o.orderItem ?? []).map((it: any) => {
            const product = it.product;
            const image =
              product?.media?.find((m: any) => m.is_primary)?.url ||
              product?.media?.[0]?.url ||
              undefined;

            const isReviewed = (product?.reviews ?? []).some(
              (r: any) => r.user.id === userId && r.order.id === o.id
            );
            const existingReview = (product?.reviews ?? []).find(
              (r: any) => r.user.id === userId && r.order.id === o.id
            );

            return {
              orderItemId: String(it.id),
              productId: product?.id,
              name: product?.name ?? it.name,
              slug: product?.slug ?? '',
              image: image ? `${BE_BASE_URL}${image}` : undefined,
              qty: it.quantity,
              price: Number(it.price ?? 0),
              isReviewed,
              reviewId: existingReview?.id,
            };
          }),
          orderItem: o.orderItem ?? [],
        }));

        if (!cancelled) {
          setRawOrders(items);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Lỗi khi lấy đơn hàng:', err);
          setRawOrders([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  // ===== Lọc theo tab + search (client-side) =====
  const filteredOrders = useMemo(() => {
    let filtered = [...rawOrders];

    if (tab !== 'all') {
      filtered = filtered.filter((o) => o.status === tab);
    }

    if (submittedQ.trim()) {
      const qLower = submittedQ.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.code.toLowerCase().includes(qLower) ||
          (o.storeName ?? '').toLowerCase().includes(qLower) ||
          o.items.some((it) => it.name.toLowerCase().includes(qLower))
      );
    }

    return filtered;
  }, [rawOrders, tab, submittedQ]);

  // Tổng số trang
  const totalPages = useMemo(
    () =>
      filteredOrders.length === 0
        ? 1
        : Math.ceil(filteredOrders.length / PAGE_SIZE),
    [filteredOrders.length]
  );

  // Slice theo page
  const paginatedOrders = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredOrders.slice(start, start + PAGE_SIZE);
  }, [filteredOrders, page]);

  // đổi tab => reset trang về 1
  const changeTab = (t: OrderTab) => {
    setTab(t);
    setPage(1);
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
      case 'waiting_group':
        return (
          <span className={`${base} bg-amber-50 text-amber-700`}>
            <Clock className="h-3 w-3" />
            Chờ nhóm hoàn tất
          </span>
        );
      case 'pending':
        return (
          <span className={`${base} bg-amber-50 text-amber-700`}>
            <Clock className="h-3 w-3" />
            Chờ xác nhận
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
            Đã hủy
          </span>
        );
      default:
        return <span className={`${base} bg-slate-100 text-slate-700`}>—</span>;
    }
  };

  const paymentStatusBadge = (payment: any) => {
    if (!payment || !payment[0]) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full px-2 py-[2px] text-xs font-medium bg-gray-50 text-gray-600">
          Chưa có thông tin
        </span>
      );
    }

    const status = Number(payment[0].status);

    switch (status) {
      case 1:
        return (
          <span className="inline-flex items-center gap-1 rounded-full px-2 py-[2px] text-xs font-medium bg-green-50 text-green-700">
            <CheckCircle className="h-3 w-3" />
            Đã thanh toán
          </span>
        );
      case 0:
        return (
          <span className="inline-flex items-center gap-1 rounded-full px-2 py-[2px] text-xs font-medium bg-orange-50 text-orange-700">
            <Clock className="h-3 w-3" />
            Chưa thanh toán
          </span>
        );
      case 2:
        return (
          <span className="inline-flex items-center gap-1 rounded-full px-2 py-[2px] text-xs font-medium bg-red-50 text-red-700">
            <XCircle className="h-3 w-3" />
            Thất bại
          </span>
        );
      case 3:
        return (
          <span className="inline-flex items-center gap-1 rounded-full px-2 py-[2px] text-xs font-medium bg-purple-50 text-purple-700">
            Hoàn tiền
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full px-2 py-[2px] text-xs font-medium bg-gray-50 text-gray-600">
            Không rõ
          </span>
        );
    }
  };

  return (
    <>
      <h1 className="text-2xl font-semibold text-slate-900 mb-4">
        Đơn hàng của tôi
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
              {Array.from({ length: PAGE_SIZE  }).map((_, i) => (
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
          {!loading && paginatedOrders.length > 0 && (
            <>
              <ul className="space-y-3">
                {paginatedOrders.map((o) => {
                  const mergedProducts = Array.from(
                    o.items.reduce(
                      (
                        map,
                        item
                      ) => {
                        if (!item.productId) return map;

                        const orderItem = o.orderItem?.find(
                          (oi) => oi.product?.id === item.productId
                        );
                        const slug =
                          orderItem?.product?.slug ??
                          (item as any).slug ??
                          '';

                        const existing = map.get(item.productId);
                        if (existing) {
                          existing.qty += item.qty;
                        } else {
                          map.set(item.productId, {
                            productId: item.productId,
                            name: item.name,
                            image: item.image,
                            qty: item.qty,
                            price: item.price,
                            isReviewed: item.isReviewed,
                            reviewId: item.reviewId ?? null,
                            slug,
                          });
                        }
                        return map;
                      },
                      new Map<
                        number,
                        {
                          productId?: number;
                          name: string;
                          image?: string;
                          qty: number;
                          price?: number;
                          isReviewed?: boolean;
                          reviewId?: number | null;
                          slug?: string;
                        }
                      >()
                    )
                  ).map(([_, v]) => v);

                  return (
                    <li
                      key={o.id}
                      className="rounded-xl border border-slate-200 p-4"
                    >
                      {/* Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-sm text-slate-700">
                          <span className="font-medium">Mã đơn:</span> {o.code}
                          {o.storeName && (
                            <span
                              className="ml-3 text-slate-500 cursor-pointer hover:text-blue-600"
                              onClick={() =>
                                navigate(`/stores/slug/${o.storeSlug}`)
                              }
                            >
                              | {o.storeName}
                            </span>
                          )}
                          {o.createdAt && (
                            <span className="ml-3 text-slate-500">
                              {new Date(o.createdAt).toLocaleString('vi-VN')}
                            </span>
                          )}
                          {o.groupOrderId && (
                            <span className="ml-3 inline-flex items-center gap-1 text-xs bg-sky-50 text-sky-600 px-2 py-0.5 rounded-full">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-3 w-3"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                              >
                                <path d="M12 2a5 5 0 0 1 5 5v3h2a3 3 0 0 1 3 3v6h-2v-6a1 1 0 0 0-1-1h-2v7h-2v-7h-4v7H9v-7H7a1 1 0 0 0-1 1v6H4v-6a3 3 0 0 1 3-3h2V7a5 5 0 0 1 5-5z" />
                              </svg>
                              Mua nhóm
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {statusPill(o.status)}
                          {paymentStatusBadge(o.payment)}
                        </div>
                      </div>

                      {/* Products */}
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {mergedProducts.slice(0, 3).map((it) => (
                          <div key={it.name} className="flex gap-3">
                            <div className="h-16 w-16 overflow-hidden rounded bg-slate-100 ring-1 ring-slate-200">
                              <img
                                src={it.image || '/placeholder.png'}
                                alt={it.name}
                                className="h-full w-full object-cover"
                                onClick={() => {
                                  if (it.slug) {
                                    navigate(`/products/slug/${it.slug}`);
                                  }
                                }}
                              />
                            </div>
                            <div className="min-w-0 flex flex-col">
                              <div className="text-sm text-slate-900 line-clamp-2">
                                {it.name}
                              </div>
                              <div className="text-xs text-slate-500">
                                SL: {it.qty}
                              </div>

                              {(o.status === 'delivered' ||
                                o.status === 'completed') && (
                                <button
                                  className={`mt-1 rounded-lg px-3 py-1 text-xs text-white ${
                                    it.isReviewed
                                      ? 'bg-sky-600 hover:bg-sky-700'
                                      : 'bg-emerald-600 hover:bg-emerald-700'
                                  }`}
                                  onClick={() => {
                                    setOpenReview(true);
                                    setSelectedProductId(
                                      it.productId?.toString() ?? null
                                    );
                                    setSelectedOrderId(o.id);
                                    setSelectedReviewId(it.reviewId ?? null);
                                  }}
                                >
                                  {it.isReviewed
                                    ? 'Đánh giá lại'
                                    : 'Đánh giá'}
                                </button>
                              )}
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

                          {['pending'].includes(o.status) && (
                            <button
                              onClick={() =>
                                setCancelModalOrderId(Number(o.id))
                              }
                              className="rounded-lg bg-rose-500 px-3 py-2 text-sm font-medium text-white hover:bg-rose-600"
                            >
                              Hủy đơn
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {/* ===== PHÂN TRANG ===== */}
              {filteredOrders.length > PAGE_SIZE && (
                <div className="mt-4 flex items-center justify-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 text-sm rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Trước
                  </button>

                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const pageNumber = idx + 1;
                    const isActive = pageNumber === page;
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => setPage(pageNumber)}
                        className={`px-3 py-1 text-sm rounded-lg border border-slate-200 ${
                          isActive
                            ? 'bg-sky-600 text-white border-sky-600'
                            : 'bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}

                  <button
                    onClick={() =>
                      setPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={page === totalPages}
                    className="px-3 py-1 text-sm rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Sau
                  </button>
                </div>
              )}
            </>
          )}

          {/* Review Modal */}
          {openReview && selectedOrderId && selectedProductId && (
            <ReviewModal
              open={openReview}
              onClose={() => setOpenReview(false)}
              orderId={Number(selectedOrderId)}
              productId={Number(selectedProductId)}
              reviewId={selectedReviewId ?? undefined}
              onSubmitted={() => {
                setOpenReview(false);
              }}
            />
          )}

          {/* Modal hủy đơn */}
          {cancelModalOrderId && (
            <CancelReasonModal
              orderId={cancelModalOrderId}
              token={localStorage.getItem('token') || ''}
              onClose={() => setCancelModalOrderId(null)}
              onCancelled={() => {
                // cập nhật trạng thái đơn trong rawOrders
                setRawOrders((prev) =>
                  prev.map((o) =>
                    o.id === String(cancelModalOrderId)
                      ? { ...o, status: 'cancelled' }
                      : o
                  )
                );
                setCancelModalOrderId(null);
              }}
            />
          )}

          {/* Empty */}
          {!loading && paginatedOrders.length === 0 && (
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
