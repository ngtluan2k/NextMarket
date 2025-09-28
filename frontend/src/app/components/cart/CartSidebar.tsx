import React, { useEffect } from "react";
import { Card, Typography, Button, Tag, message } from "antd";
import { useNavigate } from 'react-router-dom';
import { useCart } from "../../context/CartContext";
import { api } from "../../config/api";
import { CheckoutItem } from "../../components/checkout/ShippingMethod";

const { Text } = Typography;

type PaymentMethodResponse = {
  id: number;
  uuid: string;
  type: string;
  name: string;
  enabled: boolean;
  config?: any;
};

type UserAddress = {
  id: number;
  fullAddress: string;
  name?: string;
  phone?: string;
  tag?: string;
};

type CartItem = {
  productId: number;
  variantId?: number;
  price: number;
  quantity: number;
  name?: string;
  image?: string;
  storeId?: number;
};

type Props = {
  selectedTotal: number;
  selectedCount: number;
  mode?: "cart" | "checkout";
  submitLabel?: string;
  selectedPaymentMethod?: string;
  paymentMethods?: PaymentMethodResponse[];
  shippingMethod?: string;
  userAddress?: UserAddress | null;
  items?: CheckoutItem[];
  etaLabel?: string;
  onSubmit?: () => void;
};

export const CartSidebar: React.FC<Props> = ({
  selectedTotal,
  selectedCount,
  mode = "cart",
  submitLabel,
  selectedPaymentMethod,
  paymentMethods = [],
  shippingMethod,
  userAddress,
  items = [],
  etaLabel,
  
}) => {
  const { cart } = useCart() as { cart: CartItem[] };
  const navigate = useNavigate();

  const handleSubmit = async () => {
    try {
      const userId = Number(localStorage.getItem("userId") || 1);
      const storeId = cart[0]?.storeId || 1;

      if (!userAddress || userAddress.id === 0) {
        message.error("Vui lòng chọn địa chỉ giao hàng");
        return;
      }

      if (paymentMethods.length === 0 || !selectedPaymentMethod) {
        message.error("Vui lòng chọn phương thức thanh toán");
        return;
      }

      // 1. Tạo đơn hàng
      const orderPayload = {
        userId,
        storeId,
        addressId: Number(userAddress.id),
        totalAmount: Number(selectedTotal),
        shippingFee: shippingMethod === 'economy' ? 0 : 22000,
        discountTotal: 0,
        items: cart.map((item) => ({
          productId: Number(item.productId),
          ...(item.variantId ? { variantId: Number(item.variantId) } : {}),
          quantity: Number(item.quantity),
          price: Number(item.price),
        })),
        // Xóa shippingMethod và paymentMethod khỏi payload
      };

      console.log("📦 Tạo đơn hàng:", orderPayload);
      const orderRes = await api.post("/orders", orderPayload);
      const order = orderRes.data;
      console.log("📦 Đơn hàng đã được tạo:", order);

      // 2. Tìm phương thức thanh toán được chọn
      const selectedMethod = paymentMethods.find(
        (m) => m.type === selectedPaymentMethod
      );

      if (!selectedMethod) {
        message.error(`Không tìm thấy phương thức thanh toán: ${selectedPaymentMethod}`);
        return;
      }

      console.log("💳 Sử dụng phương thức thanh toán:", selectedMethod);

      // 3. Tạo thanh toán
      const paymentPayload = {
        orderUuid: order.uuid || order.id,
        paymentMethodUuid: selectedMethod.uuid,
        amount: Number(selectedTotal),
      };

      console.log("💳 Tạo thanh toán:", paymentPayload);
      const paymentRes = await api.post("/payments", paymentPayload);
      const { redirectUrl, payment } = paymentRes.data;

      console.log("💳 Kết quả thanh toán:", paymentRes.data);

      if (redirectUrl) {
        console.log("🔗 Chuyển hướng đến:", redirectUrl);
        window.location.href = redirectUrl;
      } else {
        console.log("✅ Không cần chuyển hướng, chuyển đến trang thành công");
        navigate('/order/success', {
          state: {
            orderCode: order.uuid || order.id,
            total: selectedTotal,
            paymentMethodLabel: selectedMethod.name,
            etaLabel,
            items,
          },
          replace: true,
        });
      }
    } catch (err: any) {
      console.error("❌ Lỗi tạo đơn hàng/thanh toán:", err.response?.data || err.message);
      message.error(err.response?.data?.message || "Không thể tạo đơn hàng");
    }
  };

  return (
    <div style={{ position: "sticky", top: 24, maxWidth: 360, marginLeft: "auto" }}>
      {/* Địa chỉ giao hàng */}
      <Card style={{ marginBottom: 16 }}>
        <div className="flex justify-between items-center mb-2">
          <Text strong>Giao tới</Text>
          <Button type="link" size="small">
            Thay đổi
          </Button>
        </div>

        {userAddress ? (
          <>
            <p>
              <Text strong>
                {userAddress.name ?? "Người nhận"} |{" "}
                {userAddress.phone ?? "Chưa có SĐT"}
              </Text>
            </p>
            <p>{userAddress.fullAddress}</p>
            {userAddress.tag && <Tag color="green">{userAddress.tag}</Tag>}
          </>
        ) : (
          <Text type="secondary">Đang tải địa chỉ...</Text>
        )}
      </Card>

      {/* Khuyến mãi */}
      <Card style={{ marginBottom: 16 }}>
        <div className="flex justify-between items-center mb-2">
          <Text strong>Khuyến Mãi</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Có thể chọn 2
          </Text>
        </div>
        <div className="flex flex-col gap-2">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              border: "1px solid #1890ff",
              borderRadius: 6,
              padding: "8px 12px",
            }}
          >
            <Text strong className="text-blue-600">
              Giảm 6% tối đa 50K
            </Text>
            <Button size="small" type="primary">
              Bỏ chọn
            </Button>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              border: "1px solid #1890ff",
              borderRadius: 6,
              padding: "8px 12px",
            }}
          >
            <Text strong className="text-blue-600">
              Giảm 50K
            </Text>
            <Button size="small" type="primary">
              Bỏ chọn
            </Button>
          </div>
        </div>
        <Button type="link" style={{ padding: 0, marginTop: 8 }}>
          Mua thêm để freeship 300k cho đơn này
        </Button>
      </Card>

      {/* Tổng tiền */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <Text>Tổng tiền hàng ({selectedCount})</Text>
          <Text>{selectedTotal.toLocaleString()}đ</Text>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 8,
          }}
        >
          <Text strong>Tổng thanh toán</Text>
          <Text strong style={{ color: "red", fontSize: 18 }}>
            {selectedTotal.toLocaleString()}đ
          </Text>
        </div>

        <Button
          type="primary"
          block
          size="large"
          style={{ marginTop: 16, borderRadius: 6 }}
          disabled={selectedCount === 0}
          onClick={handleSubmit}
        >
          {submitLabel ?? (mode === "checkout" ? "Đặt hàng" : `Mua Hàng (${selectedCount})`)}
        </Button>
      </Card>
    </div>
  );
};

export default CartSidebar;
