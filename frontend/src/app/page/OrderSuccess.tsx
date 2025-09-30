import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Typography, Card, Button, Result, Row, Col, Image, Spin, Divider, Tag } from "antd";
import { CheckCircleOutlined, HomeOutlined, ShoppingOutlined, ClockCircleOutlined, CreditCardOutlined, FileTextOutlined } from "@ant-design/icons";
import axios from "axios";

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
  status?: string;
};

type ApiResponse = OrderSuccessState & { success?: boolean; message?: string };

const fmt = (n?: number | string) =>
  n === undefined || n === null
    ? ""
    : `${(typeof n === "string" ? Number(n) : n).toLocaleString("vi-VN")} đ`;

const OrderSuccess: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [orderData, setOrderData] = useState<OrderSuccessState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const paymentUuid = searchParams.get("paymentUuid");
  const responseCode = searchParams.get("responseCode");
  const message = searchParams.get("message");

  const isSuccess =
    (location.state?.status && (String(location.state.status) === "success" || String(location.state.status) === "1")) ||
    responseCode === "00";

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (paymentUuid) {
        try {
          const response = await axios.get<ApiResponse>(
            `http://localhost:3000/orders/payment/${paymentUuid}`
          );
          if (response.status === 200 && response.data) {
            setOrderData(response.data);
          } else {
            setError(response.data?.message || "Không lấy được thông tin đơn hàng.");
          }
        } catch (err) {
          console.error(err);
          setError("Lỗi kết nối đến server. Vui lòng thử lại.");
        } finally {
          setLoading(false);
        }
      } else if (location.state) {
        setOrderData(location.state as OrderSuccessState);
        setLoading(false);
      } else {
        setError("Không tìm thấy thông tin đơn hàng.");
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [paymentUuid, location.state]);

  const pm = orderData?.paymentMethodLabel ?? "Không xác định";
  const total = orderData?.total ?? 0;
  const code = orderData?.orderCode ?? paymentUuid ?? "—";
  const eta = orderData?.etaLabel ?? "";
  const items = orderData?.items ?? [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div style={{ textAlign: "center" }}>
          <Spin size="large" />
          <div style={{ marginTop: 16, color: "#6b7280", fontSize: 16 }}>
            Đang tải thông tin đơn hàng...
          </div>
        </div>
      </div>
    );
  }

  if (error || !isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
        <Result
          status="error"
          title="Đặt hàng thất bại!"
          subTitle={error || message || "Vui lòng thử lại sau."}
          extra={[
            <Button 
              key="home" 
              type="primary" 
              size="large"
              icon={<HomeOutlined />}
              onClick={() => navigate("/")}
              style={{ 
                height: 44,
                borderRadius: 8,
                fontWeight: 500
              }}
            >
              Về trang chủ
            </Button>,
          ]}
        />
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      padding: "40px 0"
    }}>
      <main className="mx-auto w-full max-w-[1280px] px-6 lg:px-8">
        {/* Success Header */}
        <div style={{
          textAlign: "center",
          marginBottom: 32,
          animation: "fadeInDown 0.6s ease-out"
        }}>
          <CheckCircleOutlined style={{ 
            fontSize: 72, 
            color: "#52c41a",
            filter: "drop-shadow(0 4px 12px rgba(82, 196, 26, 0.3))"
          }} />
          <Title level={2} style={{ 
            color: "#fff", 
            marginTop: 16, 
            marginBottom: 8,
            fontSize: 32,
            fontWeight: 700
          }}>
            Đặt hàng thành công!
          </Title>
          <Text style={{ 
            color: "rgba(255,255,255,0.9)", 
            fontSize: 16 
          }}>
            Cảm ơn bạn đã tin tưởng mua sắm tại EveryMart
          </Text>
        </div>

        <Row gutter={[24, 24]}>
          {/* LEFT COLUMN */}
          <Col xs={24} lg={16}>
            {/* Order Summary Card */}
            <Card 
              style={{ 
                borderRadius: 16, 
                overflow: "hidden",
                boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
                marginBottom: 24,
                border: "none"
              }}
            >
              <div style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                padding: "28px 32px",
                marginBottom: 24
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <FileTextOutlined style={{ fontSize: 24, color: "#fff" }} />
                  <Title level={4} style={{ color: "#fff", margin: 0 }}>
                    Thông tin đơn hàng
                  </Title>
                </div>
                <div style={{ 
                  background: "rgba(255,255,255,0.15)",
                  backdropFilter: "blur(10px)",
                  borderRadius: 12,
                  padding: "16px 20px",
                  border: "1px solid rgba(255,255,255,0.2)"
                }}>
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center" 
                  }}>
                    <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 14 }}>
                      Tổng thanh toán
                    </Text>
                    <Title level={3} style={{ color: "#fff", margin: 0, fontWeight: 700 }}>
                      {fmt(total)}
                    </Title>
                  </div>
                </div>
              </div>

              <div style={{ padding: "0 32px 32px" }}>
                {/* Order Details Grid */}
                <div style={{
                  display: "grid",
                  gap: 20,
                  marginBottom: 24
                }}>
                  {/* Order Code */}
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: 16,
                    background: "#f8f9fa",
                    borderRadius: 12,
                    border: "1px solid #e9ecef"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}>
                        <FileTextOutlined style={{ fontSize: 20, color: "#fff" }} />
                      </div>
                      <div>
                        <div style={{ color: "#6b7280", fontSize: 13, marginBottom: 2 }}>
                          Mã đơn hàng
                        </div>
                        <Text strong style={{ fontSize: 15 }}>{code}</Text>
                      </div>
                    </div>
                    <Tag color="success" style={{ margin: 0, fontSize: 13, padding: "4px 12px" }}>
                      Đã thanh toán
                    </Tag>
                  </div>

                  {/* Payment Method */}
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: 16,
                    background: "#f8f9fa",
                    borderRadius: 12,
                    border: "1px solid #e9ecef"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}>
                        <CreditCardOutlined style={{ fontSize: 20, color: "#fff" }} />
                      </div>
                      <div>
                        <div style={{ color: "#6b7280", fontSize: 13, marginBottom: 2 }}>
                          Phương thức thanh toán
                        </div>
                        <Text strong style={{ fontSize: 15 }}>{pm}</Text>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Time */}
                  {eta && (
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: 16,
                      background: "#f8f9fa",
                      borderRadius: 12,
                      border: "1px solid #e9ecef"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}>
                          <ClockCircleOutlined style={{ fontSize: 20, color: "#fff" }} />
                        </div>
                        <div>
                          <div style={{ color: "#6b7280", fontSize: 13, marginBottom: 2 }}>
                            Thời gian giao dự kiến
                          </div>
                          <Text strong style={{ fontSize: 15 }}>{eta}</Text>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 20 }}>
                  * Đã bao gồm VAT nếu có
                </Text>

                <Button 
                  type="primary" 
                  size="large"
                  block 
                  icon={<HomeOutlined />}
                  onClick={() => navigate("/")}
                  style={{
                    height: 48,
                    borderRadius: 12,
                    fontSize: 16,
                    fontWeight: 600,
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    border: "none",
                    boxShadow: "0 4px 12px rgba(102, 126, 234, 0.4)"
                  }}
                >
                  Về trang chủ
                </Button>
              </div>
            </Card>
          </Col>

          {/* RIGHT COLUMN */}
          <Col xs={24} lg={8}>
            {/* Order Items Card */}
            <Card 
              style={{ 
                borderRadius: 16, 
                marginBottom: 24,
                boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
                border: "none"
              }}
            >
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                marginBottom: 20
              }}>
                <div>
                  <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: 8, 
                    marginBottom: 4 
                  }}>
                    <ShoppingOutlined style={{ color: "#667eea", fontSize: 18 }} />
                    <Text strong style={{ fontSize: 16 }}>Sản phẩm đã mua</Text>
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Mã: {code}
                  </Text>
                </div>
                <Button 
                  type="link" 
                  onClick={() => navigate(`/orders/${code}`)}
                  style={{ 
                    padding: "4px 12px",
                    height: "auto",
                    fontWeight: 500
                  }}
                >
                  Chi tiết →
                </Button>
              </div>

              <Divider style={{ margin: "16px 0" }} />

              {items.length > 0 ? (
                <div style={{ maxHeight: 400, overflowY: "auto" }}>
                  {items.map((item, index) => (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        gap: 12,
                        padding: 12,
                        marginBottom: 8,
                        background: "#f8f9fa",
                        borderRadius: 12,
                        transition: "all 0.3s ease",
                        cursor: "pointer"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#e9ecef";
                        e.currentTarget.style.transform = "translateX(4px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#f8f9fa";
                        e.currentTarget.style.transform = "translateX(0)";
                      }}
                    >
                      <Image
                        src={item.image || "/placeholder.png"}
                        alt={item.name}
                        width={60}
                        height={60}
                        style={{ 
                          borderRadius: 10, 
                          objectFit: "cover",
                          border: "2px solid #fff",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                        }}
                        preview={false}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Text 
                          ellipsis 
                          style={{ 
                            display: "block", 
                            fontWeight: 500,
                            marginBottom: 4,
                            fontSize: 14
                          }}
                        >
                          {item.name}
                        </Text>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <Tag color="blue" style={{ margin: 0, fontSize: 12 }}>
                            x{item.quantity}
                          </Tag>
                          {item.price && (
                            <Text strong style={{ color: "#667eea", fontSize: 13 }}>
                              {fmt(item.price)}
                            </Text>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ 
                  textAlign: "center", 
                  padding: "40px 20px", 
                  color: "#6b7280" 
                }}>
                  <ShoppingOutlined style={{ fontSize: 48, marginBottom: 12, opacity: 0.3 }} />
                  <div>Không có sản phẩm nào trong đơn</div>
                </div>
              )}
            </Card>

            {/* App Download Card */}
            <Card 
              style={{ 
                borderRadius: 16,
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                border: "none",
                boxShadow: "0 10px 40px rgba(0,0,0,0.15)"
              }}
            >
              <div style={{ color: "#fff" }}>
                <Title level={5} style={{ color: "#fff", marginBottom: 8 }}>
                  📱 Tải ứng dụng EveryMart
                </Title>
                <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, display: "block", marginBottom: 16 }}>
                  Trải nghiệm mua sắm tiện lợi hơn với ứng dụng di động
                </Text>
                <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                  <a href="#" aria-label="App Store">
                    <img
                      src="/badges/appstore.svg"
                      width={130}
                      height={40}
                      alt="App Store"
                      style={{ borderRadius: 8 }}
                    />
                  </a>
                  <a href="#" aria-label="Google Play">
                    <img
                      src="/badges/googleplay.svg"
                      width={130}
                      height={40}
                      alt="Google Play"
                      style={{ borderRadius: 8 }}
                    />
                  </a>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </main>

      <style>{`
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default OrderSuccess;