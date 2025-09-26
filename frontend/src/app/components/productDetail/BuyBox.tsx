// src/components/productDetail/BuyBox.tsx
import { BadgeCheck } from 'lucide-react';
import { Product } from '../productDetail/product';
import { TIKI_RED } from '../productDetail/productDetail';
import { useCart } from '../../context/CartContext';
import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { API_ENDPOINTS } from "../../../config/api";
import LoginModal from "../LoginModal";

type CheckoutLocationState = {
  items?: Array<{
    id: number;
    product_id: number;
    price: number | string;
    quantity: number;
    product: Product;
  }>;
  subtotal?: number | string;
};
const vnd = (n?: number) =>
  (n ?? 0).toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
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
  const { addToCart } = useCart();

  // fallback product object
  const [qty, setQty] = useState(1);
  const [availability, setAvailability] = useState({
    isAvailable: true,
    stock: 999,
  });
  const [loading, setLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const p = product ?? {};
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.log("🔄 BuyBox mounted/updated", {
      productId: product?.id,
      productName: product?.name,
      location: location.pathname,
      showLoginModal,
    });
    const token = localStorage.getItem("token");
    console.log("🔑 Token:", token ? "exists" : "null");
  }, [location.pathname, showLoginModal, product]);

  useEffect(() => {
    if (product?.id) {
      checkAvailability();
    }
  }, [product?.id, qty]);

  const checkAvailability = async () => {
    if (!product?.id) return;
    try {
      const response = await fetch(
        `${API_ENDPOINTS.products}/${product.id}/availability?quantity=${qty}`
      );
      if (response.ok) {
        const data = await response.json();
        setAvailability(data);
        console.log("📊 Availability:", data);
      }
    } catch (error) {
      console.error("❌ Availability error:", error);
    }
  };

  const handleBuyNow = async () => {
    console.log("🛒 BuyNow clicked", { productId: product?.id, qty });
    if (!product?.id || !product?.price || !product?.name) {
      console.error("❌ Invalid product data", product);
      alert("Thông tin sản phẩm không hợp lệ");
      return;
    }

    if (!availability.isAvailable) {
      console.error("❌ Product not available", { stock: availability.stock });
      alert("Sản phẩm hiện không đủ số lượng");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      console.log("🔐 No token, saving buyNowData");
      const productData = {
        id: product.id,
        uuid: product.uuid,
        name: product.name,
        slug: product.slug,
        price: product.price,
        base_price: product.base_price,
        listPrice: product.listPrice,
        media: product.media,
        store: product.store,
        rating: product.rating,
        reviewsCount: product.reviewsCount,
      };
      localStorage.setItem(
        "buyNowData",
        JSON.stringify({ product: productData, qty })
      );
      localStorage.setItem("returnUrl", location.pathname);
      setShowLoginModal(true);
      return;
    }

    console.log("✅ Authenticated, preparing checkout state");
    const checkoutState: CheckoutLocationState = {
      items: [{
        id: product.id,
        product_id: product.id,
        price: product.price,
        quantity: qty,
        product: {
          id: product.id,
          uuid: product.uuid,
          name: product.name,
          slug: product.slug,
          price: product.price,
          base_price: product.base_price,
          listPrice: product.listPrice,
          media: product.media,
          store: product.store,
          rating: product.rating,
          reviewsCount: product.reviewsCount,
        },
      }],
      subtotal: (product.price ?? 0) * qty,
    };

    console.log("🧭 Navigating to /checkout with state:", checkoutState);
    onBuyNow?.({ product, qty });
    navigate("/checkout", { state: checkoutState });
  };

  const handleAddToCart = async () => {
    console.log("🛒 AddToCart clicked", { productId: product?.id, qty });
    if (!product?.id) {
      console.error("❌ No product ID");
      alert("Sản phẩm không tồn tại");
      return;
    }

    if (!availability.isAvailable) {
      console.error("❌ Product not available");
      alert("Sản phẩm hiện không đủ số lượng");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      console.log("🔐 No token, redirecting to /auth");
      localStorage.setItem("returnUrl", location.pathname);
      navigate("/auth", {
        state: {
          returnUrl: location.pathname,
          message: "Vui lòng đăng nhập để thêm vào giỏ hàng",
        },
      });
      return;
    }

    setLoading(true);
    try {
      onAddToCart?.({ product: p, qty });
      alert("Đã thêm vào giỏ hàng!");
    } catch (error) {
      console.error("❌ Add to cart error:", error);
      alert("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (newQty: number) => {
    const validQty = Math.max(1, Math.min(newQty, availability.stock));
    console.log("🔢 Quantity changed:", { from: qty, to: validQty });
    setQty(validQty);
  };

  const handleLoginSuccess = async (payload: { email: string; password: string }) => {
    console.log("🔐 Login success called", { payload });
    try {
      const response = await fetch("http://localhost:3000/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || "Đăng nhập thất bại");

      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.data));
      window.dispatchEvent(new CustomEvent("userLogin"));

      const cartRes = await fetch("http://localhost:3000/cart/me", {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });
      const cartJson = await cartRes.json();
      localStorage.setItem("cart", JSON.stringify(cartJson));

      const buyNowData = localStorage.getItem("buyNowData");
      const returnUrl = localStorage.getItem("returnUrl") || "/";
      console.log("📋 Post-login:", { buyNowData, returnUrl });

      if (buyNowData) {
        const { product: savedProduct, qty: savedQty } = JSON.parse(buyNowData);
        const checkoutState: CheckoutLocationState = {
          items: [{
            id: savedProduct.id,
            product_id: savedProduct.id,
            price: savedProduct.price,
            quantity: savedQty,
            product: {
              id: savedProduct.id,
              uuid: savedProduct.uuid,
              name: savedProduct.name,
              slug: savedProduct.slug,
              price: savedProduct.price,
              base_price: savedProduct.base_price,
              listPrice: savedProduct.listPrice,
              media: savedProduct.media,
              store: savedProduct.store,
              rating: savedProduct.rating,
              reviewsCount: savedProduct.reviewsCount,
            },
          }],
          subtotal: (savedProduct.price ?? 0) * savedQty,
        };

        console.log("🧭 Navigating to /checkout post-login", checkoutState);
        navigate("/checkout", { state: checkoutState });
      } else {
        console.log("📍 No buyNowData, navigating to", returnUrl);
        localStorage.removeItem("returnUrl");
        navigate(returnUrl);
      }

      setShowLoginModal(false);
    } catch (error: any) {
      console.error("❌ Login error:", error);
      localStorage.removeItem("buyNowData");
      localStorage.removeItem("returnUrl");
      alert(error?.message ?? "Đăng nhập thất bại. Vui lòng thử lại.");
    }
  };

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
      await addToCart(Number(product.id), quantity, selectedVariantId ?? undefined);
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

        {/* Price Calculation */}
        <div className="mt-4 text-sm text-slate-600">Tạm tính</div>
        <div className="text-[26px] font-bold text-red-600">
          {vnd((p.base_price ?? 0) * qty)}
        </div>

        {/* Discount Info */}
        {p.listPrice && p.listPrice > (p.price ?? 0) && (
          <div className="mt-2 text-sm">
            <span className="text-slate-400 line-through">
              {vnd(p.listPrice * qty)}
            </span>
            <span className="ml-2 text-red-600 font-medium">
              Tiết kiệm {vnd((p.listPrice - (p.price ?? 0)) * qty)}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-4 space-y-2">
          <button
            className={`h-11 w-full rounded-xl px-4 text-base font-semibold text-white transition-opacity ${
              !availability.isAvailable || loading
                ? "opacity-50 cursor-not-allowed"
                : "hover:opacity-90"
            }`}
            style={{ background: TIKI_RED }}
            onClick={handleBuyNow}
            disabled={!availability.isAvailable || loading}
          >
            {loading ? "Đang xử lý..." : "Mua ngay"}
          </button>

          <button
            className={`h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-base font-semibold text-slate-700 transition-colors ${
              !availability.isAvailable || loading
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-slate-50"
            }`}
            onClick={handleAddToCart}
            disabled={!availability.isAvailable || loading}
          >
            {loading ? "Đang xử lý..." : "Thêm vào giỏ"}
          </button>

          <button
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            disabled={!availability.isAvailable}
          >
            Mua trước trả sau
          </button>
        </div>

        {/* Availability Warning */}
        {!availability.isAvailable && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600 font-medium">
              ⚠️ Sản phẩm hiện đã hết hàng
            </p>
          </div>
        )}

        {/* Shipping Info */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <span className="font-medium">🚚 Miễn phí vận chuyển</span>
          </div>
          <p className="text-xs text-blue-600 mt-1">
            Cho đơn hàng từ ₫150,000 trong nội thành
          </p>
        </div>

        {/* Debug info */}
        <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
          <div>Modal State: {showLoginModal ? "OPEN" : "CLOSED"}</div>
          <div>Has Token: {localStorage.getItem("token") ? "YES" : "NO"}</div>
          <div>Product ID: {product?.id || "None"}</div>
        </div>
      </aside>

      <LoginModal
        open={showLoginModal}
        onClose={() => {
          console.log("🚪 Closing LoginModal");
          localStorage.removeItem("buyNowData");
          localStorage.removeItem("returnUrl");
          setShowLoginModal(false);
        }}
        onLogin={handleLoginSuccess}
        apiBase="http://localhost:3000"
      />
    </>
  );
}