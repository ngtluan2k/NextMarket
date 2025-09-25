// src/page/OrderSuccess.tsx
import React from "react";
import { Card, Row, Col, Typography, Button, Divider, Tag, Image } from "antd";
import { Link, useLocation, useNavigate } from "react-router-dom";

const { Title, Text } = Typography;

type OrderSuccessState = {
  orderCode: string;
  total: number;
  paymentMethodLabel: string;
  etaLabel?: string;
  items: Array<{
    id: number | string;
    name: string;
    image?: string;
    quantity: number;
    price?: number | string;
    oldPrice?: number | string;
  }>;
};

const fmt = (n?: number | string) =>
  n === undefined || n === null
    ? ""
    : `${(typeof n === "string" ? Number(n) : n).toLocaleString("vi-VN")} đ`;

const OrderSuccess: React.FC = () => {
  const nav = useNavigate();
  const { state } = useLocation() as { state: OrderSuccessState };

  const pm = state?.paymentMethodLabel ?? "—";
  const total = state?.total ?? 0;
  const code = state?.orderCode ?? "—";
  const eta = state?.etaLabel ?? "";

  return (
    <div className="min-h-screen flex flex-col bg-[#f6f7fb]">
      <main className="mx-auto w-full max-w-[1280px] px-6 lg:px-8 py-8 flex-1">
        <Row gutter={24} wrap={false} align="top">
          {/* LEFT */}
          <Col flex="1">
            <Card
              style={{ borderRadius: 12, overflow: "hidden" }}
              bodyStyle={{ padding: 0 }}
            >
              {/* header xanh + confetti */}
              <div
                style={{
                  padding: "18px 20px",
                  background:
                    "linear-gradient(90deg, #40a9ff 0%, #1677ff 60%, #6db6ff 100%)",
                  color: "#fff",
                }}
              >
                <Title level={4} style={{ color: "#fff", margin: 0 }}>
                  Yay, đặt hàng thành công!
                </Title>
                <div>Chuẩn bị giao hàng {fmt(total)}</div>
              </div>

              <div style={{ padding: 18 }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    rowGap: 10,
                    columnGap: 16,
                    marginBottom: 12,
                  }}
                >
                  <div style={{ color: "#6b7280" }}>Phương thức thanh toán</div>
                  <div style={{ textAlign: "right" }}>{pm}</div>

                  <div style={{ color: "#6b7280" }}>Thanh toán khi nhận</div>
                  <div style={{ textAlign: "right" }}>
                    <Text strong>{fmt(total)}</Text>
                  </div>
                </div>

                <Text type="secondary" style={{ fontSize: 12 }}>
                  (Đã bao gồm VAT nếu có)
                </Text>

                <Divider style={{ margin: "14px 0" }} />

                <Button type="default" block onClick={() => nav("/")}>
                  Quay về trang chủ
                </Button>
              </div>
            </Card>
          </Col>

          {/* RIGHT */}
          <Col flex="360px">
            <Card style={{ borderRadius: 12, marginBottom: 12 }}>
              <div className="flex justify-between items-center">
                <div>
                  <div style={{ color: "#6b7280", fontSize: 12 }}>Mã đơn hàng</div>
                  <div style={{ fontWeight: 600 }}>{code}</div>
                </div>
                <Link to={`/orders/${code}`}>Xem đơn hàng</Link>
              </div>

              {eta && (
                <div
                  style={{
                    marginTop: 12,
                    background: "#f5fbff",
                    border: "1px solid #e6f4ff",
                    borderRadius: 8,
                    padding: "8px 10px",
                    fontWeight: 500,
                  }}
                >
                  🎁 <span style={{ color: "#1677ff" }}>{eta}</span>
                </div>
              )}

              {/* item tóm tắt */}
              {state?.items?.[0] && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "48px 1fr",
                    gap: 12,
                    marginTop: 12,
                  }}
                >
                  <Image
                    src={state.items[0].image}
                    alt={state.items[0].name}
                    width={48}
                    height={48}
                    style={{ borderRadius: 8, objectFit: "cover" }}
                    preview={false}
                  />
                  <div>
                    <Text ellipsis style={{ display: "block", maxWidth: 260 }}>
                      {state.items[0].name}
                    </Text>
                    <Text type="secondary">SL: x{state.items[0].quantity}</Text>
                  </div>
                </div>
              )}
            </Card>

            {/* app badges */}
            <Card style={{ borderRadius: 12 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>
                Mua sắm tiết kiệm hơn trên ứng dụng EveryMart
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <a href="#" aria-label="App Store">
                  <img
                    src="/badges/appstore.svg"
                    width={120}
                    height={36}
                    alt="App Store"
                  />
                </a>
                <a href="#" aria-label="Google Play">
                  <img
                    src="/badges/googleplay.svg"
                    width={120}
                    height={36}
                    alt="Google Play"
                  />
                </a>
              </div>
            </Card>
          </Col>
        </Row>
      </main>
    </div>
  );
};

export default OrderSuccess;