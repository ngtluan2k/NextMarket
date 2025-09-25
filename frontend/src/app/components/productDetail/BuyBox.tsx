import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { BadgeCheck } from "lucide-react";
import { Product } from "./product";
import { TIKI_RED } from "../productDetail/productDetail";
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
  width,
  minHeight,
  stickyTop,
  onBuyNow,
  onAddToCart,
}: {
  product?: Product;
  width?: number;
  minHeight?: number;
  stickyTop?: number;
  onBuyNow?: (p: { product?: Product; qty: number }) => void;
  onAddToCart?: (p: { product?: Product; qty: number }) => void;
}) {
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

  return (
    <>
      <aside
        className="self-start h-fit rounded-2xl bg-white p-5 ring-1 ring-slate-200 lg:sticky"
        style={{ width, minHeight, top: stickyTop }}
      >
        {/* Seller Info - Tiki style */}
        <div className="flex items-center gap-2">
          <div>
            <div className="text-sm font-semibold">
              {p.store?.name || p.sellerName || "Tiki Trading"}
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <BadgeCheck className="h-4 w-4 text-sky-600" />
              OFFICIAL • {(p.rating ?? 4.5).toFixed(1)}
            </div>
          </div>
        </div>

        {/* Quantity Selector */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Số lượng</span>
            {availability.stock < 10 && (
              <span className="text-red-500">
                Chỉ còn {availability.stock} sản phẩm
              </span>
            )}
          </div>
          <div className="inline-flex items-center rounded-lg border border-slate-200">
            <button
              className="px-3 py-2 hover:bg-slate-50 disabled:opacity-50"
              onClick={() => handleQuantityChange(qty - 1)}
              disabled={qty <= 1 || loading}
            >
              -
            </button>
            <div className="w-10 text-center text-sm">{qty}</div>
            <button
              className="px-3 py-2 hover:bg-slate-50 disabled:opacity-50"
              onClick={() => handleQuantityChange(qty + 1)}
              disabled={qty >= availability.stock || loading}
            >
              +
            </button>
          </div>
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