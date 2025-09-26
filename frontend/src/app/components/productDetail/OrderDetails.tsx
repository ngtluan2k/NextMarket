import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  MapPin,
  ChevronRight,
  CreditCard,
  Truck,
  ShieldCheck,
  Gift,
  Tag,
  Clock,
  Star,
  BadgeCheck,
  Plus,
  Edit,
} from "lucide-react";
import { API_BASE_URL, API_ENDPOINTS } from "../../../config/api";

const TIKI_RED = "#ff424e";

const vnd = (n?: number) =>
  (n ?? 0).toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  });

export default function OrderDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get product data from navigation state
  const { product, quantity } = location.state || {};
  
  // State management
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState("cod");
  const [couponCode, setCouponCode] = useState("");
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orderPreview, setOrderPreview] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [user, setUser] = useState(null);
  const [availablePromotions, setAvailablePromotions] = useState([]);
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  // Debug: Log location state
  useEffect(() => {
    console.log("🔄 OrderDetail mounted");
    console.log("📍 Location state:", location.state);
    console.log("📦 Product:", product);
    console.log("🔢 Quantity:", quantity);
  }, []);

  // Redirect if no product data
  useEffect(() => {
    if (!product || !quantity) {
      console.log("❌ No product or quantity in state, redirecting to /");
      navigate("/", { state: { error: "Không có thông tin sản phẩm để đặt hàng" } });
      return;
    }
    
    loadInitialData();
  }, [product, quantity]);

  // Recalculate when payment method or coupon changes
  useEffect(() => {
    if (product && selectedAddress) {
      calculateOrderPreview();
    }
  }, [selectedPayment, appliedCoupon, selectedAddress]);

  const loadInitialData = async () => {
    setLoading(true);
    console.log("📞 Loading initial data...");
    try {
      await Promise.all([
        loadUserData(),
        loadPaymentMethods(),
        loadAvailablePromotions(),
      ]);
    } catch (error) {
      console.error("❌ Error loading initial data:", error);
    } finally {
      setLoading(false);
      console.log("🛑 Loading initial data complete");
    }
  };

  const loadUserData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.log("❌ No token, redirecting to /auth");
        navigate("/auth");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load user data");
      }

      const userData = await response.json();
      console.log("👤 User data loaded:", userData);
      setUser(userData);
      
      // Load user addresses
      await loadAddresses(userData.id);
    } catch (error) {
      console.error("❌ Error loading user data:", error);
      navigate("/auth");
    }
  };

  const loadAddresses = async (userId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/user/${userId}/addresses`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const addressData = await response.json();
        setAddresses(addressData);
        console.log("🏠 Addresses loaded:", addressData);
        
        // Set default address
        const defaultAddr = addressData.find((addr) => addr.isDefault);
        if (defaultAddr) {
          setSelectedAddress(defaultAddr.id);
        } else if (addressData.length > 0) {
          setSelectedAddress(addressData[0].id);
        }
      } else {
        console.log("⚠️ No addresses from API, using mock data");
        const mockAddresses = [
          {
            id: 1,
            name: user?.name || "Nguyễn Văn A",
            phone: user?.phone || "0987654321",
            address: "123 Đường ABC, Phường XYZ, Quận 1, TP.HCM",
            isDefault: true,
          },
        ];
        setAddresses(mockAddresses);
        setSelectedAddress(1);
      }
    } catch (error) {
      console.error("❌ Error loading addresses:", error);
      const mockAddresses = [
        {
          id: 1,
          name: user?.name || "Nguyễn Văn A",
          phone: user?.phone || "0987654321",
          address: "123 Đường ABC, Phường XYZ, Quận 1, TP.HCM",
          isDefault: true,
        },
      ];
      setAddresses(mockAddresses);
      setSelectedAddress(1);
    }
  };

  const loadPaymentMethods = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/payment/methods`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const methods = await response.json();
        setPaymentMethods(methods);
        console.log("💳 Payment methods loaded:", methods);
      } else {
        console.log("⚠️ No payment methods from API, using mock data");
        setPaymentMethods([
          {
            id: "cod",
            name: "Thanh toán khi nhận hàng",
            icon: "💰",
            description: "Phí thu hộ: ₫15,000",
            fee: 15000,
          },
          {
            id: "momo",
            name: "Ví MoMo",
            icon: "🟣",
            description: "Giảm ₫30,000 cho đơn từ ₫300,000",
            fee: 0,
          },
          {
            id: "credit",
            name: "Thẻ tín dụng/ghi nợ",
            icon: "💳",
            description: "Visa, Mastercard, JCB",
            fee: 0,
          },
        ]);
      }
    } catch (error) {
      console.error("❌ Error loading payment methods:", error);
      setPaymentMethods([
        {
          id: "cod",
          name: "Thanh toán khi nhận hàng",
          icon: "💰",
          description: "Phí thu hộ: ₫15,000",
          fee: 15000,
        },
      ]);
    }
  };

  const loadAvailablePromotions = async () => {
    try {
      const token = localStorage.getItem("token");
      const orderData = {
        productId: product.id,
        quantity: quantity,
        totalAmount: product.price * quantity,
      };

      const response = await fetch(`${API_BASE_URL}/promotions/available`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        const promotions = await response.json();
        setAvailablePromotions(promotions);
        console.log("🎁 Promotions loaded:", promotions);
        
        // Auto apply best promotion
        if (promotions.length > 0) {
          const bestPromo = promotions[0];
          setAppliedCoupon(bestPromo);
        }
      }
    } catch (error) {
      console.error("❌ Error loading promotions:", error);
    }
  };

  const calculateOrderPreview = async () => {
    const subtotal = product.price * quantity;
    const shippingFee = 25000;
    const selectedPaymentMethod = paymentMethods.find((p) => p.id === selectedPayment);
    const paymentFee = selectedPaymentMethod?.fee || 0;
    
    let discount = 0;
    if (appliedCoupon) {
      if (appliedCoupon.discountType === "percentage") {
        discount = Math.min(
          (subtotal * appliedCoupon.discountValue) / 100,
          appliedCoupon.maxDiscountAmount || subtotal
        );
      } else {
        discount = appliedCoupon.discountValue;
      }
    }
    
    const total = subtotal + shippingFee + paymentFee - discount;
    
    setOrderPreview({
      subtotal,
      shippingFee,
      paymentFee,
      discount,
      total,
    });
    console.log("📊 Order preview updated:", { subtotal, shippingFee, paymentFee, discount, total });
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/promotions/apply`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: couponCode,
          productId: product.id,
          quantity: quantity,
          totalAmount: product.price * quantity,
        }),
      });

      const result = await response.json();
      
      if (result.isValid) {
        setAppliedCoupon({
          code: couponCode,
          discountType: "fixed",
          discountValue: result.discount,
          name: `Mã giảm giá ${couponCode}`,
        });
        setCouponCode("");
        setShowCouponInput(false);
        alert("Áp dụng mã giảm giá thành công!");
      } else {
        alert(result.message || "Mã giảm giá không hợp lệ");
      }
    } catch (error) {
      console.error("❌ Error applying coupon:", error);
      alert("Có lỗi xảy ra khi áp dụng mã giảm giá");
    }
  };

  const handleCreateOrder = async () => {
    if (!selectedAddress) {
      console.log("❌ No address selected");
      alert("Vui lòng chọn địa chỉ giao hàng");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const orderData = {
        items: [
          {
            productId: product.id,
            quantity: quantity,
            price: product.price,
          },
        ],
        shippingAddressId: selectedAddress,
        paymentMethodId: selectedPayment,
        shippingOptionId: "standard",
        couponCode: appliedCoupon?.code || null,
        notes: "",
      };

      console.log("📦 Creating order with data:", orderData);
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create order");
      }

      const order = await response.json();
      console.log("✅ Order created:", order);

      // Create payment record if needed
      if (selectedPayment !== "cod") {
        await createPaymentRecord(order.id);
      }
      
      // Clear buyNowData
      localStorage.removeItem("buyNowData");
      
      console.log("🧭 Navigating to /account/orders");
      navigate("/account/orders", {
        state: {
          newOrderId: order.id,
          showSuccess: true,
          orderNumber: order.orderNumber,
        },
      });
    } catch (error) {
      console.error("❌ Error creating order:", error);
      alert(error.message || "Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const createPaymentRecord = async (orderId) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_BASE_URL}/payments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderUuid: orderId,
          method: selectedPayment,
          amount: orderPreview.total,
          status: "pending",
        }),
      });
      console.log("💳 Payment record created for order:", orderId);
    } catch (error) {
      console.error("❌ Error creating payment record:", error);
    }
  };

  if (!product || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-500"></div>
          <p className="mt-4 text-gray-600">Đang tải thông tin đơn hàng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <button onClick={() => navigate(-1)} className="hover:text-gray-900">
              Giỏ hàng
            </button>
            <ChevronRight className="w-4 h-4" />
            <span className="font-medium text-gray-900">Thông tin đơn hàng</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Order Info */}
          <div className="lg:col-span-2 space-y-4">
            {/* Delivery Address */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-red-500" />
                  <h3 className="font-semibold">Giao tới</h3>
                </div>
                <button className="flex items-center gap-1 text-blue-600 text-sm hover:underline">
                  <Plus className="w-4 h-4" />
                  Thêm địa chỉ mới
                </button>
              </div>
              
              {addresses.length > 0 ? (
                <div className="space-y-3">
                  {addresses.map((addr) => (
                    <label
                      key={addr.id}
                      className="flex items-start gap-3 cursor-pointer p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <input
                        type="radio"
                        name="address"
                        value={addr.id}
                        checked={selectedAddress === addr.id}
                        onChange={() => setSelectedAddress(addr.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{addr.name}</span>
                          <span className="text-gray-600">|</span>
                          <span className="text-gray-600">{addr.phone}</span>
                          {addr.isDefault && (
                            <span className="px-2 py-1 bg-red-100 text-red-600 text-xs rounded">
                              Mặc định
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm mt-1">{addr.address}</p>
                      </div>
                      <button className="text-blue-600 hover:text-blue-800">
                        <Edit className="w-4 h-4" />
                      </button>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p>Chưa có địa chỉ giao hàng</p>
                  <button className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Thêm địa chỉ
                  </button>
                </div>
              )}
            </div>

            {/* Products */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">T</span>
                </div>
                <span className="font-medium">{product.store?.name || "Tiki Trading"}</span>
                <BadgeCheck className="w-4 h-4 text-blue-600" />
              </div>

              <div className="flex gap-4 pb-4">
                <img
                  src={product.images?.[0] || product.image || product.media?.[0]?.url || "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=300&h=300&fit=crop"}
                  alt={product.name}
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
                    {product.name}
                  </h4>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm text-gray-600">{product.rating || 4.5}</span>
                      <span className="text-sm text-gray-400">({product.reviewsCount || 0})</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-red-600">
                        {vnd(product.price)}
                      </span>
                      {product.listPrice && product.listPrice > product.price && (
                        <span className="text-gray-400 line-through text-sm">
                          {vnd(product.listPrice)}
                        </span>
                      )}
                    </div>
                    <span className="text-gray-600">SL: {quantity}</span>
                  </div>
                </div>
              </div>

              {/* Shipping Info */}
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 text-sm">
                  <Truck className="w-4 h-4 text-green-600" />
                  <span className="text-green-600 font-medium">Giao hàng tiết kiệm</span>
                  <span className="text-gray-600">- Nhận hàng từ 3 - 5 ngày</span>
                </div>
                <div className="flex items-center gap-2 text-sm mt-1">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span className="text-blue-600">Được đồng kiểm</span>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold mb-4">Phương thức thanh toán</h3>
              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <label
                    key={method.id}
                    className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border hover:bg-gray-50"
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={method.id}
                      checked={selectedPayment === method.id}
                      onChange={(e) => setSelectedPayment(e.target.value)}
                      className="mt-1"
                    />
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-2xl">{method.icon}</span>
                      <div>
                        <div className="font-medium">{method.name}</div>
                        <div className="text-sm text-gray-600">{method.description}</div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Promotions */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Tag className="w-5 h-5 text-orange-500" />
                  <h3 className="font-semibold">Khuyến mãi</h3>
                </div>
                <button
                  onClick={() => setShowCouponInput(!showCouponInput)}
                  className="text-blue-600 text-sm hover:underline"
                >
                  {showCouponInput ? "Ẩn" : "Chọn hoặc nhập mã"}
                </button>
              </div>

              {showCouponInput && (
                <div className="mb-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nhập mã giảm giá"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                    >
                      Áp dụng
                    </button>
                  </div>
                </div>
              )}

              {appliedCoupon && (
                <div className="bg-gradient-to-r from-red-50 to-orange-50 p-3 rounded-lg border border-red-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Gift className="w-4 h-4 text-red-600" />
                      <span className="text-sm font-medium text-red-600">
                        {appliedCoupon.name}
                      </span>
                    </div>
                    <button
                      onClick={() => setAppliedCoupon(null)}
                      className="text-red-600 text-sm hover:underline"
                    >
                      Bỏ áp dụng
                    </button>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Tiết kiệm được {vnd(orderPreview?.discount || 0)}
                  </p>
                </div>
              )}

              {availablePromotions.length > 0 && !appliedCoupon && (
                <div className="space-y-2">
                  {availablePromotions.map((promo) => (
                    <div
                      key={promo.id}
                      className="p-3 border border-orange-200 rounded-lg cursor-pointer hover:bg-orange-50"
                      onClick={() => setAppliedCoupon(promo)}
                    >
                      <div className="flex items-center gap-2">
                        <Gift className="w-4 h-4 text-orange-600" />
                        <span className="text-sm font-medium text-orange-600">
                          {promo.name}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{promo.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-4 shadow-sm sticky top-4">
              <h3 className="font-semibold mb-4">Đơn hàng</h3>
              
              {orderPreview && (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Tạm tính</span>
                    <span>{vnd(orderPreview.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Phí vận chuyển</span>
                    <span>{vnd(orderPreview.shippingFee)}</span>
                  </div>
                  {orderPreview.paymentFee > 0 && (
                    <div className="flex justify-between">
                      <span>Phí thanh toán</span>
                      <span>{vnd(orderPreview.paymentFee)}</span>
                    </div>
                  )}
                  {orderPreview.discount > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Giảm giá</span>
                      <span>-{vnd(orderPreview.discount)}</span>
                    </div>
                  )}
                  <hr />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Tổng tiền</span>
                    <span className="text-red-600">{vnd(orderPreview.total)}</span>
                  </div>
                </div>
              )}

              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-600">
                    Giao hàng dự kiến
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Thứ 2 - Thứ 4, 25/09 - 27/09
                </p>
              </div>

              <button
                onClick={handleCreateOrder}
                disabled={loading || !selectedAddress}
                className={`w-full mt-6 h-12 rounded-lg text-white font-semibold text-lg transition-opacity ${
                  loading || !selectedAddress
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:opacity-90"
                }`}
                style={{ backgroundColor: TIKI_RED }}
              >
                {loading ? "Đang đặt hàng..." : "Đặt hàng"}
              </button>

              <p className="text-xs text-gray-500 mt-3 text-center">
                Bằng việc tiến hành Đặt Mua, bạn đồng ý với{" "}
                <button className="text-blue-600 hover:underline">
                  Điều khoản & Điều kiện
                </button>{" "}
                của Tiki
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}