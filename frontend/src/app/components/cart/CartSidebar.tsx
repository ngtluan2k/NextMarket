import React from "react";
import { Card, Typography, Button, Tag } from "antd";
import { useCart } from "../../context/CartContext";

const { Text } = Typography;

type Props = {
  selectedTotal: number;
  selectedCount: number;

  mode?: "cart" | "checkout"; 
  submitLabel?: string; 
  onSubmit?: () => void;
};


export const CartSidebar: React.FC<Props> = ({ selectedTotal, selectedCount,  mode = "cart",
    submitLabel,
    onSubmit, }) => {
  const { cart } = useCart();
  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  // Giả sử lấy từ API
  const discount = 20000;
  const finalTotal = total - discount;

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
        <p>
          <Text strong>Lê Đặng Nhật Huy | 0342420875</Text>
        </p>
        <p>Phú Vang, Xã Hòa Liên, Huyện Hòa Vang, Đà Nẵng</p>
        <Tag color="green">Nhà</Tag>
        <div
          style={{
            background: "#fff7e6",
            border: "1px solid #ffd591",
            borderRadius: 6,
            padding: 8,
            marginTop: 8,
          }}
        >
          <Text type="warning" style={{ fontSize: 13 }}>
            Lưu ý: Sử dụng địa chỉ nhận hàng trước sáp nhập
          </Text>
        </div>
      </Card>

      {/* Khuyến mãi */}
      <Card style={{ marginBottom: 16 }}>
        <div className="flex justify-between items-center mb-2">
          <Text strong> Khuyến Mãi</Text>
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
            onClick={onSubmit}
            >
            {submitLabel ?? (mode === "checkout" ? "Đặt hàng" : `Mua Hàng (${selectedCount})`)}
        </Button>

      </Card>
    </div>
  );
};
