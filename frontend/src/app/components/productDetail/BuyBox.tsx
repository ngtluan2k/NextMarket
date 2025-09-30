import React, { useMemo, useState } from 'react';
import { BadgeCheck } from 'lucide-react';
import { Product } from '../productDetail/product';
import { TIKI_RED } from '../productDetail/productDetail';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import LoginModal from '../LoginModal';
import { message } from 'antd';
export const vnd = (n?: number) =>
  (n ?? 0).toLocaleString('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  });

export default function BuyBox({
  product,
  selectedVariantId,
  quantity,
  setQuantity,
  calculatedPrice,
  width,
  minHeight,
  stickyTop,
  onBuyNow,
  showMessage,
}: {
  product?: Product;
  selectedVariantId: number | null;
  quantity: number;
  setQuantity: (qty: number) => void;
  calculatedPrice: number;
  width?: number;
  minHeight?: number;
  stickyTop?: number;
  onBuyNow?: (p: { product?: Product; qty: number }) => void;
  showMessage?: (
    type: 'success' | 'error' | 'warning',
    content: string
  ) => void;
}) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [availability, setAvailability] = useState({
    isAvailable: true,
    stock: 999,
  });
  const location = useLocation();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const p = product ?? {};

  const unitPrice = useMemo(() => {
    if (!product) return 0;
    let currentPrice = calculatedPrice;
    const rules: { min_qty: number; price: number }[] = (
      product.pricing_rules ?? []
    ).map((r: any) => ({
      min_qty: r.min_quantity,
      price: Number(r.price),
    }));
    if (rules.length > 0) {
      const matched = rules
        .filter((r) => quantity >= r.min_qty)
        .sort((a, b) => b.min_qty - a.min_qty)[0];
      if (matched) currentPrice = matched.price;
    }
    return currentPrice;
  }, [product, calculatedPrice, quantity]);

  const totalPrice = useMemo(() => unitPrice * quantity, [unitPrice, quantity]);

  if (!product) return null;

  const handleAddToCart = async (product: Product, quantity: number) => {
    setLoading(true);
    try {
      console.log('Adding to cart:', product.name, 'Quantity:', quantity);
      await addToCart(
        Number(product.id),
        quantity,
        selectedVariantId ?? undefined
      );
      if (showMessage) {
        showMessage('success', `${product.name} đã được thêm vào giỏ hàng`);
      }
    } catch (error) {
      console.error('Failed to add to cart:', error);
      if (showMessage) {
        showMessage('error', 'Thêm vào giỏ thất bại');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClickStore = () => {
    if (product.store?.slug) {
      navigate(`/stores/slug/${product.store.slug}`);
    }
  };

  const handleBuyNow = async () => {
    console.log('🛒 BuyNow clicked', { productId: product?.id, quantity });
    console.log('💾 Product store info:', product?.store);
    console.log('🛒 BuyNow clicked', { productId: product?.id, quantity });
    if (!product?.id || !product?.name) {
      console.error('❌ Invalid product data', product);
      message.error('Thông tin sản phẩm không hợp lệ');
      return;
    }

    if (!availability.isAvailable) {
      console.error('❌ Product not available', { stock: availability.stock });
      message.error('Sản phẩm hiện không đủ số lượng');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('🔐 No token, saving buyNowData');
        const productData = {
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: unitPrice,
          base_price: product.base_price,
          listPrice: product.listPrice,
          media: product.media,

          store: product.store,
          rating: product.rating,
          reviewsCount: product.reviewsCount,
        };
        localStorage.setItem(
          'buyNowData',
          JSON.stringify({ product: productData, qty: quantity })
        );
        localStorage.setItem('returnUrl', location.pathname);
        setShowLoginModal(true);
        return;
      }

      // THÊM: Đồng bộ với cart
      await handleAddToCart(product, quantity);

      console.log('✅ Authenticated, preparing checkout state');
      const checkoutState = {
        items: [
          {
            id: Number(product.id),
            product_id: Number(product.id),
            price: unitPrice,
            quantity,
            variantId: selectedVariantId ?? undefined, 
            product: {
              ...product,
              variants: selectedVariantId
                ? [{ id: selectedVariantId, price: unitPrice }]
                : [],
            },
          },
        ],
        subtotal: unitPrice * quantity,
      };

      console.log(
        '🧭 Navigating to /checkout with state:',
        JSON.stringify(checkoutState, null, 2)
      );
      onBuyNow?.({ product, qty: quantity });
      navigate('/checkout', { state: checkoutState });
    } catch (err: any) {
      console.error('❌ Error in handleBuyNow:', err);
      message.error('Không thể thực hiện mua ngay');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <aside
        className="self-start h-fit rounded-2xl bg-white p-5 ring-1 ring-slate-200 lg:sticky"
        style={{ width, minHeight, top: stickyTop }}
      >
        {/* Seller info */}
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={handleClickStore}
        >
          <img
            src={product.store?.logo_url ?? 'https://via.placeholder.com/24'}
            className="h-6 w-6 rounded-full"
            alt={product.store?.name ?? 'Store'}
          />
          <div>
            <div className="text-sm font-semibold">
              {product.store?.name ?? 'Official Store'}
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <BadgeCheck className="h-4 w-4 text-sky-600" /> OFFICIAL •{' '}
              {(product.rating ?? 0).toFixed(1)}
            </div>
          </div>
        </div>

        {/* Quantity */}
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

        {/* Price */}
        <div className="mt-4 text-sm text-slate-600">Tạm tính</div>
        <div className="text-[26px] font-bold">{vnd(totalPrice)}</div>

        {/* Actions */}
        <div className="mt-4 space-y-2">
          <button
            className={`h-11 w-full rounded-xl px-4 text-base font-semibold text-white transition-opacity ${
              !availability.isAvailable || loading
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:opacity-90'
            }`}
            style={{ background: TIKI_RED }}
            onClick={handleBuyNow}
            disabled={!availability.isAvailable || loading}
          >
            {loading ? 'Đang xử lý...' : 'Mua ngay'}
          </button>
          <button
            className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-base font-semibold text-slate-700 hover:bg-slate-50"
            onClick={() => handleAddToCart(p as Product, quantity)}
            disabled={loading}
          >
            Thêm vào giỏ
          </button>

          <button className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-700">
            Mua trước trả sau
          </button>
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
