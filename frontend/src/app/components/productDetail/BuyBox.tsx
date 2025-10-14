import React, { useEffect, useMemo, useState } from 'react';
import { BadgeCheck } from 'lucide-react';
import { vnd, TIKI_RED } from '../../types/productDetail';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import LoginModal from '../LoginModal';
import { Product } from '../../types/product';
import { LightProduct, CheckoutLocationState } from '../../types/buyBox';
import { API_BASE_URL } from '../../api/api';
import { Users } from 'lucide-react';
import { Rate } from 'antd';
import { log } from 'console';
import { useAuth } from '../../hooks/useAuth';
import { useGroupOrderItems } from '../../hooks/useGroupOrderItems';
import { StarFilled } from '@ant-design/icons';

function toAbs(p?: string) {
  if (!p) return '';
  let s = p.trim();

  if (/^data:/i.test(s)) return s;
  if (/^https?:\/\//i.test(s)) return s;
  s = s.replace(/\\/g, '/');
  if (/^[a-zA-Z]:\//.test(s) || s.startsWith('file:/')) {
    const idx = s.toLowerCase().lastIndexOf('/uploads/');
    if (idx >= 0) s = s.slice(idx + 1);
  }
  return `${API_BASE_URL}/${s.replace(/^\/+/, '')}`;
}

export default function BuyBox({
  product,
  selectedVariantId,
  quantity,
  setQuantity,
  calculatedPrice,
  maxQuantity,
  width,
  minHeight,
  stickyTop,
  onBuyNow,
  showMessage,
  selectedType,
  groupId,
}: {
  product?: Product;
  selectedVariantId: number | null;
  quantity: number;
  setQuantity: (qty: number) => void;
  calculatedPrice: number;
  maxQuantity: number;
  totalPrice: number;
  width?: number;
  minHeight?: number;
  stickyTop?: number;
  onBuyNow?: (p: { product?: LightProduct; qty: number }) => void;
  showMessage?: (
    type: 'success' | 'error' | 'warning',
    content: string
  ) => void;
  selectedType?: 'bulk' | 'subscription' | 'normal';
  groupId?: number | null;
}) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const p = product ?? {};
  const location = useLocation();
  const { addItem: addGroupItem } = useGroupOrderItems(groupId ?? null);

  const availability = useMemo(() => {
    const v = product?.variants?.find((v) => v.id === selectedVariantId);
    return (v?.stock ?? 0) > 0;
  }, [product, selectedVariantId]);

  const v = product?.variants?.find((v) => v.id === selectedVariantId);

  const [loading, setLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    console.log('BuyBox mounted/updated', {
      productId: product?.id,
      productName: product?.name,
      location: location.pathname,
      showLoginModal,
    });
    const token = localStorage.getItem('token');
    console.log(' Token:', token ? 'exists' : 'null');
  }, [location.pathname, showLoginModal, product, quantity]);

  const handleBuyNow = async () => {
    console.log(' BuyNow clicked', {
      productId: product?.id,
      quantity,
      variantId: selectedVariantId,
    });
    console.log('product to buy: ' + JSON.stringify(product));

    if (!product?.id) {
      console.error('Invalid product data', product);
      alert('Thông tin sản phẩm không hợp lệ');
      return;
    }

    if (!availability) {
      console.error('Sản phẩm hiện không đủ số lượng');
      alert('Sản phẩm hiện không đủ số lượng');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token, saving buyNowData');
      localStorage.setItem(
        'buyNowData',
        JSON.stringify({ product: p, quantity, variantId: selectedVariantId })
      );
      localStorage.setItem('returnUrl', location.pathname);
      setShowLoginModal(true);
      return;
    }

    const checkoutState: CheckoutLocationState = {
      items: [
        {
          id: product.id,
          product_id: product.id,
          price: calculatedPrice,
          quantity: quantity,
          type: selectedType,
          product: {
            id: product.id,
            name: product.name,
            media: (() => {
              if (selectedVariantId && product.variants && product.media) {
                const variantIndex = product.variants.findIndex(
                  (v) => v.id === selectedVariantId
                );
                if (variantIndex >= 0 && product.media[variantIndex]) {
                  return [product.media[variantIndex]];
                }
              }
              return product.media
                ? product.media.filter((m) => m.is_primary).length > 0
                  ? product.media.filter((m) => m.is_primary)
                  : [product.media[0]]
                : [];
            })(),
            store: product.store,
            rating: product.rating,
            reviewsCount: product.reviewsCount,
          },
          variant: v,
        },
      ],
      subtotal: calculatedPrice * quantity,
    };

    console.log(JSON.stringify(checkoutState));
    console.log('Navigating to /checkout with state:', checkoutState);
    navigate('/checkout', { state: checkoutState });
  };

  // --- tính giá dựa trên variant + pricing_rules ---

  const totalPrice = useMemo(
    () => calculatedPrice * quantity,
    [calculatedPrice, quantity]
  );
  if (!product) return null;

  const handleAddToCart = async (
    product: Product,
    quantity: number,
    type: 'bulk' | 'subscription' | 'normal'
  ) => {
    console.log('🛒 Add to Cart clicked:', {
      productId: product.id,
      productName: product.name,
      quantity,
      selectedVariantId,
      type,
      price: calculatedPrice,
      groupId,
    });
    setLoading(true);
    try {
      console.log('Before addToCart, quantity =', quantity);

      await addToCart(
        Number(product.id),
        quantity,
        selectedVariantId ?? undefined,
        type,
        !!groupId
      );
      console.log('After addToCart, quantity =', quantity);

      if (showMessage) {
        showMessage('success', `${product.name} đã được thêm vào giỏ hàng`);
      }
    } catch (error: any) {
      console.error('Failed to add to cart:', error);
      if (showMessage) {
        showMessage('error', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddToGroup = async () => {
    try {
      if (!groupId) return;

      // bắt đăng nhập nếu chưa có user
      if (!user?.id) {
        showMessage?.('warning', 'Vui lòng đăng nhập để mua chung');
        setShowLoginModal(true);
        return;
      }

      // validate product
      if (!product?.id) {
        showMessage?.('error', 'Sản phẩm không hợp lệ');
        return;
      }

      // chuẩn hoá quantity
      const qty = Number.isFinite(Number(quantity)) && Number(quantity) > 0
        ? Number(quantity)
        : 1;

      setLoading(true);

      console.log('🛒 Adding to Group Order:', {
        groupId,
        productId: product.id,
        variantId: selectedVariantId,
        quantity: qty,
        // BE sẽ tự tính price theo logic mới
      });

      // ✅ KHÔNG gửi userId và price - BE tự xử lý
      await addGroupItem({
        productId: Number(product.id),
        variantId: selectedVariantId ?? undefined,
        quantity: qty,
        // ❌ BỎ userId - BE lấy từ JWT token
        // ❌ BỎ price - BE tự tính theo calculateItemPrice()
        note: undefined, // có thể thêm nếu cần
      });

      showMessage?.('success', 'Đã thêm vào đơn hàng nhóm');
    } catch (e: any) {
      let msg = 'Không thể thêm vào nhóm';

      if (e?.response?.data?.message) {
        msg = e.response.data.message;
      } else if (e?.message) {
        msg = e.message;
      }

      // ✅ Xử lý các lỗi pricing cụ thể
      if (msg.includes('pricing') || msg.includes('giá')) {
        msg = 'Không thể xác định giá sản phẩm. Vui lòng thử lại.';
      }

      showMessage?.('error', msg);
      console.error('handleAddToGroup error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleClickStore = () => {
    if (product.store?.slug) {
      navigate(`/stores/slug/${product.store.slug}`);
    }
  };

  return (
    <>
      <aside
        className="self-start h-fit rounded-2xl bg-white p-5 ring-1 ring-slate-200 lg:sticky"
        style={{ width, minHeight, top: stickyTop }}
      >
        {/* Nút tạo mua chung (chỉ hiện khi không ở group mode) */}
        {!groupId && (
          <button
            onClick={() => navigate(`/group-orders/store/${product?.store?.id}/create`)}
            className="absolute right-4 top-4 flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 shadow-sm hover:shadow-md hover:bg-slate-50 transition-all"
          >
            <Users size={16} />
            Mua chung
          </button>
        )}

        {/* Banner group mode */}
        {groupId && (
          <div className="mb-4 p-3 bg-sky-50 border border-sky-200 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-sky-700">
              <Users size={16} />
              <span className="font-medium">Đang mua chung</span>
            </div>
            <div className="text-xs text-sky-600 mt-1">
              Sản phẩm sẽ được thêm vào đơn hàng nhóm
            </div>
          </div>
        )}

        {/* Thông tin cửa hàng */}
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={handleClickStore}
        >
          <div className="h-13 w-13 rounded-full ring-1 ring-slate-200 overflow-hidden">
            {product?.store?.logo_url ? (
              <img
                src={toAbs(product.store.logo_url)}
                alt={product?.store?.name ?? 'Store'}
                className="h-10 w-10 object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            ) : (
              <svg
                className="h-10 w-10 text-slate-400 bg-white"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M3 21a9 9 0 1 1 18 0"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
            )}
          </div>

          <div>
            <div className="text-sm font-semibold">
              {product?.store?.name ?? 'Official Store'}
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <BadgeCheck className="h-4 w-4 text-sky-600" /> OFFICIAL •{' '}
              {Number(product.store?.avg_rating ?? 0).toFixed(1) || '0'}{' '}
              <StarFilled style={{ color: '#faad14' }} /> •{' '}
              {product.store?.review_count ?? 0} đánh giá
            </div>
          </div>
        </div>

        {/* Số lượng */}
        <div className="mt-5">
          <div className="text-xs text-slate-500">Số lượng</div>
          <div className="inline-flex items-center rounded-lg border border-slate-200">
            <button
              className="px-3 py-2 hover:bg-slate-50"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
            >
              -
            </button>
            <div className="w-10 text-center text-sm">{quantity}</div>
            <button
              className="px-3 py-2 hover:bg-slate-50"
              onClick={() => setQuantity(quantity + 1)}
            >
              +
            </button>
          </div>
        </div>

        {/* Giá tạm tính */}
        <div className="mt-4 text-sm text-slate-600">Tạm tính</div>
        <div className="text-[26px] font-bold">{vnd(totalPrice)}</div>

        {/* Thông tin giảm giá (nếu có) */}
        {p.listPrice && p.listPrice > (p.price ?? 0) && (
          <div className="mt-2 text-sm">
            <span className="text-slate-400 line-through">
              {vnd(p.listPrice * quantity)}
            </span>
            <span className="ml-2 text-red-600 font-medium">
              Tiết kiệm {vnd((p.listPrice - (p.price ?? 0)) * quantity)}
            </span>
          </div>
        )}

        {/* Hành động */}
        <div className="mt-4 space-y-2">
          {groupId ? (
            <>
              <button
                className={`h-11 w-full rounded-xl px-4 text-base font-semibold text-white transition-opacity ${!availability || loading ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
                  }`}
                style={{ background: TIKI_RED }}
                onClick={handleAddToGroup}
                disabled={!availability || loading}
              >
                {loading ? 'Đang xử lý...' : 'Thêm vào nhóm'}
              </button>
              <button
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-base font-semibold text-slate-700 hover:bg-slate-50"
                onClick={() => handleAddToCart(product as any, quantity, selectedType ?? 'normal')}
                disabled={loading}
              >
                Thêm vào giỏ
              </button>
            </>
          ) : (
            <>
              <button
                className={`h-11 w-full rounded-xl px-4 text-base font-semibold text-white transition-opacity ${!availability || loading ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
                  }`}
                style={{ background: TIKI_RED }}
                onClick={handleBuyNow}
                disabled={!availability || loading}
              >
                {loading ? 'Đang xử lý...' : 'Mua ngay'}
              </button>
              <button
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-base font-semibold text-slate-700 hover:bg-slate-50"
                onClick={() => handleAddToCart(product as any, quantity, selectedType ?? 'normal')}
                disabled={loading}
              >
                Thêm vào giỏ
              </button>
            </>
          )}

          {!groupId && (
            <button className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-700">
              Mua trước trả sau
            </button>
          )}
        </div>
      </aside>

      <LoginModal
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        title="Đăng nhập để mua ngay"
      />
    </>
  );
}
