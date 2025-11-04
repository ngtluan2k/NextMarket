// src/pages/account/OrderDetailPage.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Phone,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Copy,
} from 'lucide-react';
import { orderService } from '../../../service/order.service';
import CancelReasonModal from '../../components/account/CancelReasonModal';
import { getGroupOrderWithOrders } from './../../../service/groupOrderItems.service';

/* ===== Helpers ===== */
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

const mapStatus = (status: number): OrderTab => {
  switch (status) {
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
};

const formatVND = (n = 0) =>
  Number(n).toLocaleString('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  });

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

function toAbs(p?: string) {
  if (!p) return '';
  let s = String(p).trim().replace(/\\/g, '/');
  if (/^https?:\/\//i.test(s) || /^data:image\//i.test(s)) return s;
  if (/^[a-zA-Z]:\//.test(s) || s.startsWith('file:/')) {
    const idx = s.toLowerCase().lastIndexOf('/uploads/');
    if (idx >= 0) s = s.slice(idx + 1);
  }
  if (!/^\/?uploads\//i.test(s)) s = `uploads/${s.replace(/^\/+/, '')}`;
  return `${API_BASE_URL}/${s.replace(/^\/+/, '')}`;
}

function firstMediaUrl(media: any): string {
  if (!media) return '';
  if (typeof media === 'string') {
    try {
      const parsed = JSON.parse(media);
      if (Array.isArray(parsed) && parsed.length) {
        const m0 = parsed.find((x: any) => x?.is_primary) ?? parsed[0];
        return typeof m0 === 'string' ? m0 : m0?.url ?? m0?.path ?? '';
      }
      return media;
    } catch {
      return media;
    }
  }
  if (Array.isArray(media) && media.length) {
    const m0 = media.find((x: any) => x?.is_primary) ?? media[0];
    return m0?.url ?? m0?.path ?? '';
  }
  if (typeof media === 'object') {
    return media?.url ?? media?.path ?? '';
  }
  return '';
}

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

const StatusPill: React.FC<{ s: OrderTab }> = ({ s }) => {
  const base =
    'inline-flex items-center gap-1 rounded-full px-2 py-[2px] text-xs font-medium';
  if (s === 'pending')
    return (
      <span className={`${base} bg-amber-50 text-amber-700`}>
        <Clock className="h-3 w-3" />
        Chờ thanh toán
      </span>
    );
  if (s === 'confirmed')
    return (
      <span className={`${base} bg-blue-50 text-blue-700`}>
        <CheckCircle className="h-3 w-3" />
        Đã xác nhận
      </span>
    );
  if (s === 'processing')
    return (
      <span className={`${base} bg-sky-50 text-sky-700`}>
        <Package className="h-3 w-3" />
        Đang xử lý
      </span>
    );
  if (s === 'shipping')
    return (
      <span className={`${base} bg-indigo-50 text-indigo-700`}>
        <Truck className="h-3 w-3" />
        Đang vận chuyển
      </span>
    );
  if (s === 'delivered')
    return (
      <span className={`${base} bg-emerald-50 text-emerald-700`}>
        <CheckCircle className="h-3 w-3" />
        Đã giao
      </span>
    );
  if (s === 'completed')
    return (
      <span className={`${base} bg-emerald-50 text-emerald-700`}>
        <CheckCircle className="h-3 w-3" />
        Hoàn thành
      </span>
    );
  if (s === 'cancelled')
    return (
      <span className={`${base} bg-rose-50 text-rose-700`}>
        <XCircle className="h-3 w-3" />
        Đã huỷ
      </span>
    );
  return <span className={`${base} bg-slate-100 text-slate-700`}>—</span>;
};

/* ===== Component ===== */
export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any | null>(null);
  const [cancelOrderId, setCancelOrderId] = useState<number | null>(null);
  const [groupSummary, setGroupSummary] = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      try {
        if (order?.group_order_id) {
          const data = await getGroupOrderWithOrders(Number(order.group_order_id));
          // API trả { message, data: { groupInfo, orders } } => hàm đã .data.data
          setGroupSummary(data?.groupInfo ?? null);
        } else {
          setGroupSummary(null);
        }
      } catch (e) {
        setGroupSummary(null);
      }
    })();
  }, [order?.group_order_id]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const numericId = Number(id);
        if (Number.isNaN(numericId)) throw new Error('Order id phải là số');
        const res = await orderService.getOrderDetail(numericId);
        console.log('🧩 Chi tiết đơn hàng:', res);
        if (!cancelled) setOrder(res ?? null);
      } catch (e) {
        console.error('Lỗi load chi tiết đơn:', e);
        if (!cancelled) setOrder(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const status: OrderTab = useMemo(
    () => mapStatus(Number(order?.status ?? -1)),
    [order?.status]
  );

  const items = useMemo(() => {
    const raw = order?.orderItem ?? [];
    return raw.map((it: any) => {
      const img = getProductImage(it.product, it.variant);
      return {
        ...it,
        name: it.product?.name ?? it.name ?? '',
        image: img ? toAbs(img) : '',
      };
    });
  }, [order]);

  const addr = order?.userAddress ?? {};
  const recipient = addr.recipient_name || addr.fullName || addr.name || '';
  const phone = addr.phone || addr.phoneNumber || order?.phone || '';
  const addressLine = [
    addr.street,
    addr.ward,
    addr.district,
    addr.province,
    addr.country,
  ]
    .filter(Boolean)
    .join(', ');

  const canCancel = ['pending', 'confirmed'].includes(status);
  const canReview = ['delivered', 'completed'].includes(status);

  if (loading) {
    return (
      <div className="rounded-xl bg-white ring-1 ring-slate-100 shadow p-6 text-sm text-slate-500">
        Đang tải chi tiết đơn hàng…
      </div>
    );
  }
  if (!order) {
    return (
      <div className="rounded-xl bg-white ring-1 ring-slate-100 shadow p-6 text-sm text-slate-500">
        Không tìm thấy đơn hàng.
        <div className="mt-4">
          <button
            onClick={() => navigate('/account/orders')}
            className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50"
          >
            ← Quay lại danh sách đơn
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl bg-white ring-1 ring-slate-100 shadow">
        {/* Header gọn */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-slate-100">
          <button
            onClick={() => navigate('/account/orders')}
            className="flex items-center text-sm text-slate-600 hover:text-sky-600"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Quay lại
          </button>
          <div className="flex items-center gap-2 text-sm text-slate-700 flex-wrap">
            <span className="font-medium text-slate-900">Mã đơn:</span>
            {order.uuid}
            <button
              onClick={() =>
                navigator.clipboard.writeText(order?.uuid || id || '')
              }
              className="text-slate-400 hover:text-sky-600"
            >
              <Copy className="h-4 w-4" />
            </button>
            <StatusPill s={status} />
          </div>
        </div>

        {/* Nội dung */}
        <div className="p-3 space-y-3 text-sm">
          {/* Địa chỉ nhận */}
          <section className="rounded-lg border border-slate-100 p-3">
            <div className="font-medium text-slate-900 mb-1">
              Thông tin nhận hàng
            </div>
            <div className="text-slate-700 space-y-1">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-slate-400" />
                <span>{addressLine}</span>
              </div>
              {(recipient || phone) && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <span>
                    {recipient}
                    {phone ? ` • ${phone}` : ''}
                  </span>
                </div>
              )}
            </div>
          </section>

          {/* Thanh toán + vận chuyển */}
          <section className="rounded-lg border border-slate-100 p-3">
            <div className="font-medium text-slate-900 mb-1">
              Thanh toán & giao hàng
            </div>
            <div className="grid sm:grid-cols-2 gap-x-4 text-slate-700">
              <div>
                <div>
                  Phương thức:{' '}
                  {order?.payment?.[0]?.paymentMethod?.name || 'Chưa rõ'}
                </div>
                <div
                  className={
                    order?.isPaid ? 'text-emerald-600' : 'text-amber-600'
                  }
                >
                  {order?.isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
                </div>
              </div>
              <div>
                <div>Đơn vị vận chuyển: {order?.shippingProvider || '—'}</div>
                <div>Mã vận đơn: {order?.trackingCode || '—'}</div>
              </div>
            </div>
          </section>


          {/* Nhóm mua chung (nếu có) */}
          {groupSummary && (
            <section className="rounded-lg border border-slate-100 p-3">
              <div className="flex items-center justify-between">
                <div className="font-medium text-slate-900">
                  Mua chung: {groupSummary.name || `Group #${groupSummary.id}`}
                </div>
                <a
                  href={`/group-orders/${groupSummary.id}/detail`}
                  className="text-sm text-sky-600 hover:underline"
                >
                  Xem nhóm
                </a>
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2 text-sm text-slate-700">
                <div>
                  Giao hàng:{' '}
                  <span className="font-semibold">
                    {groupSummary.delivery_mode === 'member_address'
                      ? 'Giao riêng từng người'
                      : 'Giao về chủ nhóm'}
                  </span>
                </div>
                <div>
                  Giảm giá nhóm:{' '}
                  <span className="font-semibold">
                    {(Number(groupSummary.discount_percent || 0)).toLocaleString()}%
                  </span>
                </div>
                <div>
                  Thành viên:{' '}
                  <span className="font-semibold">{groupSummary.members?.length ?? 0}</span>
                </div>
              </div>
            </section>
          )}

          {/* Sản phẩm */}
          <section className="rounded-lg border border-slate-100 p-3">
            <div className="font-medium text-slate-900 mb-1">Sản phẩm</div>
            <ul className="divide-y divide-slate-100">
              {items.map((it: any) => (
                <li key={it.id} className="py-2 flex items-center gap-2">
                  <img
                    src={it.image || '/placeholder.png'}
                    alt={it.name}
                    className="h-12 w-12 rounded border border-slate-100 object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-slate-900 truncate">{it.name}</div>
                    {it.variant?.variant_name && (
                      <div className="text-xs text-slate-500">
                        {it.variant.variant_name}
                      </div>
                    )}
                    <div className="text-xs text-slate-500">
                      SL: {it.quantity}
                    </div>
                    <div className="text-xs text-slate-500">
                      Loại hàng:{' '}
                      {it.variant?.pricingRules?.[0]?.type || 'Chưa rõ'}
                    </div>
                  </div>
                  <div className="text-slate-900 text-sm font-medium">
                    {formatVND((it.price || 0) * (it.quantity ?? 1))}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Chi tiết tiền */}
          <section className="rounded-lg border border-slate-100 p-3">
            <div className="font-medium text-slate-900 mb-1">
              Chi tiết thanh toán
            </div>
            <div className="space-y-1 text-slate-700">
              <div className="flex justify-between">
                <span>Tạm tính</span>
                <span>{formatVND(order?.subtotal ?? 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Phí vận chuyển</span>
                <span>{formatVND(order?.shippingFee ?? 0)}</span>
              </div>
              {order?.discountAmount && (
                <div className="flex justify-between text-rose-600">
                  <span>Giảm giá</span>
                  <span>-{formatVND(order.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-100 pt-1 font-semibold text-slate-900">
                <span>Tổng cộng</span>
                <span>{formatVND(order?.totalAmount ?? 0)}</span>
              </div>
            </div>
          </section>

          {/* Ghi chú / Lý do hủy */}
          {order?.note && (
            <section className="rounded-lg border border-slate-100 p-3">
              <div className="font-medium text-slate-900 mb-1">Ghi chú</div>
              <p className="text-slate-700">{order.note}</p>
            </section>
          )}
          {order?.status === 6 && order?.cancelReason && (
            <section className="rounded-lg border border-rose-100 bg-rose-50 p-3">
              <div className="font-medium text-rose-700 mb-1">
                Lý do huỷ đơn
              </div>
              <p className="text-rose-700 text-sm">{order.cancelReason}</p>
            </section>
          )}

          {/* Nút hành động */}
          <section className="flex justify-end">
            {canCancel && (
              <button
                onClick={() => setCancelOrderId(Number(order.id))}
                className="rounded-md bg-rose-600 px-3 py-1.5 text-sm text-white hover:bg-rose-700"
              >
                Hủy đơn
              </button>
            )}
            {canReview && (
              <button
                onClick={() =>
                  navigate(`/account/reviews/new?orderId=${order.id}`)
                }
                className="ml-2 rounded-md bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-700"
              >
                Đánh giá
              </button>
            )}
          </section>
        </div>
      </div>

      {/* Modal hủy đơn */}
      {cancelOrderId && (
        <CancelReasonModal
          orderId={cancelOrderId}
          token={localStorage.getItem('token') || ''}
          onClose={() => setCancelOrderId(null)}
          onCancelled={() => setCancelOrderId(null)}
        />
      )}
    </>
  );
}
