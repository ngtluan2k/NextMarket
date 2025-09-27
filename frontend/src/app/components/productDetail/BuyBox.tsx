// src/components/productDetail/BuyBox.tsx
import React, { useMemo, useState } from 'react';
import { BadgeCheck } from 'lucide-react';
import { Product } from '../productDetail/product';
import { TIKI_RED } from '../productDetail/productDetail';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import LoginModal from '../LoginModal';
import { useLocation } from 'react-router-dom';

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
  selectedVariantId: number | null; // CHANGED: Allow null
  quantity: number;
  setQuantity: (qty: number) => void;
  calculatedPrice: number;
  totalPrice: number;
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

  // fallback product object
  const p = product ?? {};

  // --- tính giá dựa trên variant + pricing_rules ---
  const unitPrice = useMemo(() => {
    if (!product) return 0;

    let currentPrice = calculatedPrice;

    // lấy rules từ product
    const rules: { min_qty: number; price: number }[] = (
      product.pricing_rules ?? []
    ).map((r: any) => ({
      min_qty: r.min_quantity,
      price: Number(r.price),
    }));

    // áp dụng rule theo quantity
    if (rules.length > 0) {
      const matched = rules
        .filter((r) => quantity >= r.min_qty)
        .sort((a, b) => b.min_qty - a.min_qty)[0];
      if (matched) currentPrice = matched.price;
    }

    return currentPrice;
  }, [product, calculatedPrice, quantity]);

  // giá tổng = đơn giá x số lượng
  const totalPrice = useMemo(() => unitPrice * quantity, [unitPrice, quantity]);

  if (!product) return null;

  const handleAddToCart = async (product: Product, quantity: number) => {
    try {
      console.log('Adding to cart:', product.name, 'Quantity:', quantity);
      // Only pass variantId if it's not null
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
    }
  };

  const handleClickStore = () => {
    if (product.store?.slug) {
      navigate(`/stores/slug/${product.store.slug}`);
    }
  };

  const handleBuyNow = async () => {
    console.log('🛒 BuyNow clicked', { productId: product?.id, quantity });
    if (!product?.id || !product?.name) {
      console.error('❌ Invalid product data', product);
      alert('Thông tin sản phẩm không hợp lệ');
      return;
    }

    if (!availability.isAvailable) {
      console.error('❌ Product not available', { stock: availability.stock });
      alert('Sản phẩm hiện không đủ số lượng');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      console.log('🔐 No token, saving buyNowData');
      const productData = {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: unitPrice, // lấy giá theo rule
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

    console.log('✅ Authenticated, preparing checkout state');
    const checkoutState = {
      items: [
        {
          id: product.id,
          product_id: product.id,
          price: unitPrice,
          quantity,
          product: {
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
          },
        },
      ],
      subtotal: unitPrice * quantity,
    };

    console.log('🧭 Navigating to /checkout with state:', checkoutState);
    onBuyNow?.({ product, qty: quantity });
    navigate('/checkout', { state: checkoutState });
  };

  return (
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
        >
          Thêm vào giỏ
        </button>

        <button className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-700">
          Mua trước trả sau
        </button>
      </div>
    </aside>
  );
}
