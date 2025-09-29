import React, { useState, useEffect } from "react";
import { Card, Row, Col, Typography, Button, Divider, Tag, Image } from "antd";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios"; // Giả sử dùng axios để gọi API

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

type ApiResponse = OrderSuccessState & { success: boolean; message: string };

const fmt = (n?: number | string) =>
  n === undefined || n === null
    ? ""
    : `${(typeof n === "string" ? Number(n) : n).toLocaleString("vi-VN")} đ`;

const OrderSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [orderData, setOrderData] = useState<OrderSuccessState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lấy dữ liệu từ query string
  const paymentUuid = searchParams.get("paymentUuid");
  const responseCode = searchParams.get("responseCode");
  const message = searchParams.get("message");

  // Fetch dữ liệu từ API khi component mount
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!paymentUuid) {
        setError("Không tìm thấy mã thanh toán.");
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get<ApiResponse>(
          `http://localhost:3000/orders/payment/${paymentUuid}`
        );
        if (response.data.success) {
          setOrderData(response.data);
        } else {
          setError(response.data.message || "Lỗi khi lấy thông tin đơn hàng.");
        }
      } catch (err) {
        setError("Lỗi kết nối đến server. Vui lòng thử lại.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [paymentUuid]);

  // Dữ liệu fallback nếu API chưa tải xong
  const pm = orderData?.paymentMethodLabel ?? "VNPay";
  const total = orderData?.total ?? 0;
  const code = orderData?.orderCode ?? paymentUuid ?? "—";
  const eta = orderData?.etaLabel ?? "";
  const items = orderData?.items ?? [];

  const isSuccess = responseCode === "00";

  if (loading) {
    return <div>Đang tải...</div>; // Hiển thị loading state
  }

  if (error || !isSuccess) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f6f7fb]">
        <main className="mx-auto w-full max-w-[1280px] px-6 lg:px-8 py-8 flex-1">
          <div style={{ textAlign: "center", color: "#ff4d4f" }}>
            <Title level={4}>Đặt hàng thất bại!</Title>
            <Text>{error || message || "Vui lòng thử lại sau."}</Text>
            <Button
              type="primary"
              style={{ marginTop: 16 }}
              onClick={() => navigate("/")}
            >
              Quay về trang chủ
            </Button>
          </div>
        </main>
      </div>
    );
  }

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

                <Button
                  type="default"
                  block
                  onClick={() => navigate("/")}
                >
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
              {items[0] && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "48px 1fr",
                    gap: 12,
                    marginTop: 12,
                  }}
                >
                  <Image
                    src={items[0].image}
                    alt={items[0].name}
                    width={48}
                    height={48}
                    style={{ borderRadius: 8, objectFit: "cover" }}
                    preview={false}
                  />
                  <div>
                    <Text ellipsis style={{ display: "block", maxWidth: 260 }}>
                      {items[0].name}
                    </Text>
                    <Text type="secondary">SL: x{items[0].quantity}</Text>
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