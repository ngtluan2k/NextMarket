import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Typography,
  Card,
  Button,
  Result,
  Row,
  Col,
  Image,
  Spin,
  Divider,
  Tag,
} from 'antd';
import {
  CheckCircleOutlined,
  HomeOutlined,
  ShoppingOutlined,
  ClockCircleOutlined,
  CreditCardOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import { orderService } from '../../service/order.service';
const { Title, Text } = Typography;

/** Palette đồng bộ với trang Orders */
const COLORS = {
  primaryA: '#0ea5e9', // sky-500
  primaryB: '#38bdf8', // sky-400
  primaryText: '#0ea5e9',
  pageBgTop: '#f5faff',
  pageBgBottom: '#ffffff',
  softBg: '#f8fafc',
  softBorder: '#e2e8f0',
  textMuted: '#6b7280',
};

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
    ? ''
    : `${(typeof n === 'string' ? Number(n) : n).toLocaleString('vi-VN')} đ`;

const OrderSuccess: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [orderData, setOrderData] = useState<OrderSuccessState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const paymentUuid = searchParams.get('paymentUuid');
  const responseCode = searchParams.get('responseCode');
  const message = searchParams.get('message');

  const isSuccess =
    (location.state?.status &&
      (String(location.state.status) === 'success' ||
        String(location.state.status) === '1')) ||
    responseCode === '00'||
    (location.state?.orderCode && !error);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (paymentUuid) {
        try {
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          const userId = user?.id || user?.sub;

          if (!userId) {
            setError('Không xác định được người dùng');
            setLoading(false);
            return;
          }

          const data = await orderService.findByPaymentUuid(
            userId,
            paymentUuid
          );
          if (data) {
            setOrderData(data);
          } else {
            setError('Không lấy được thông tin đơn hàng.');
          }
        } catch (err) {
          console.error(err);
          setError('Lỗi kết nối đến server. Vui lòng thử lại.');
        } finally {
          setLoading(false);
        }
      } else if (location.state) {
        setOrderData(location.state as OrderSuccessState);
        setLoading(false);
      } else {
        setError('Không tìm thấy thông tin đơn hàng.');
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [paymentUuid, location.state]);

  const pm = orderData?.paymentMethodLabel ?? 'Không xác định';
  const total = orderData?.total ?? 0;
  const code = orderData?.orderCode ?? paymentUuid ?? '—';
  const eta = orderData?.etaLabel ?? '';
  const items = orderData?.items ?? [];

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: `linear-gradient(180deg, ${COLORS.pageBgTop} 0%, ${COLORS.pageBgBottom} 100%)`,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16, color: COLORS.textMuted, fontSize: 16 }}>
            Đang tải thông tin đơn hàng...
          </div>
        </div>
      </div>
    );
  }

  if (error || !isSuccess) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#fff' }}
      >
        <Result
          status="error"
          title="Đặt hàng thất bại!"
          subTitle={error || message || 'Vui lòng thử lại sau.'}
          extra={[
            <Button
              key="home"
              type="primary"
              size="large"
              icon={<HomeOutlined />}
              onClick={() => navigate('/')}
              style={{
                height: 44,
                borderRadius: 8,
                fontWeight: 500,
                background: `linear-gradient(135deg, ${COLORS.primaryA} 0%, ${COLORS.primaryB} 100%)`,
                border: 'none',
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
    <div
      style={{
        minHeight: '100vh',
        background: `linear-gradient(180deg, ${COLORS.pageBgTop} 0%, ${COLORS.pageBgBottom} 100%)`,
        padding: '32px 0',
      }}
    >
      <main className="mx-auto w-full max-w-[1280px] px-6 lg:px-8">
        {/* Success Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <CheckCircleOutlined
            style={{
              fontSize: 64,
              color: '#22c55e',
              filter: 'drop-shadow(0 4px 10px rgba(34,197,94,0.25))',
            }}
          />
          <Title
            level={2}
            style={{
              color: '#0f172a',
              marginTop: 12,
              marginBottom: 6,
              fontWeight: 700,
            }}
          >
            Đặt hàng thành công!
          </Title>
          <Text style={{ color: COLORS.textMuted, fontSize: 14 }}>
            Cảm ơn bạn đã tin tưởng mua sắm tại EveryMart
          </Text>
        </div>

        <Row gutter={[24, 24]}>
          {/* LEFT */}
          <Col xs={24} lg={16}>
            <Card
              style={{
                borderRadius: 16,
                overflow: 'hidden',
                boxShadow: '0 8px 30px rgba(2,6,23,0.06)',
                marginBottom: 24,
                border: `1px solid ${COLORS.softBorder}`,
              }}
              bodyStyle={{ padding: 0 }}
            >
              <div
                style={{
                  background: `linear-gradient(135deg, ${COLORS.primaryA} 0%, ${COLORS.primaryB} 100%)`,
                  padding: '24px 28px',
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    marginBottom: 12,
                  }}
                >
                  <FileTextOutlined style={{ fontSize: 22, color: '#fff' }} />
                  <Title level={4} style={{ color: '#fff', margin: 0 }}>
                    Thông tin đơn hàng
                  </Title>
                </div>
                <div
                  style={{
                    background: 'rgba(255,255,255,0.18)',
                    borderRadius: 12,
                    padding: '14px 16px',
                    border: '1px solid rgba(255,255,255,0.25)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14 }}
                    >
                      Tổng thanh toán
                    </Text>
                    <Title
                      level={3}
                      style={{ color: '#fff', margin: 0, fontWeight: 700 }}
                    >
                      {fmt(total)}
                    </Title>
                  </div>
                </div>
              </div>

              <div style={{ padding: '0 28px 24px' }}>
                <div style={{ display: 'grid', gap: 16, marginBottom: 20 }}>
                  {/* Order Code */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: 14,
                      background: COLORS.softBg,
                      borderRadius: 12,
                      border: `1px solid ${COLORS.softBorder}`,
                    }}
                  >
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 12 }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          background: `linear-gradient(135deg, ${COLORS.primaryA} 0%, ${COLORS.primaryB} 100%)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <FileTextOutlined
                          style={{ fontSize: 18, color: '#fff' }}
                        />
                      </div>
                      <div>
                        <div
                          style={{
                            color: COLORS.textMuted,
                            fontSize: 13,
                            marginBottom: 2,
                          }}
                        >
                          Mã đơn hàng
                        </div>
                        <Text strong style={{ fontSize: 15 }}>
                          {code}
                        </Text>
                      </div>
                    </div>
                    <Tag
                      color="blue"
                      style={{ margin: 0, fontSize: 13, padding: '4px 12px' }}
                    >
                      Đã thanh toán
                    </Tag>
                  </div>

                  {/* Payment Method */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: 14,
                      background: COLORS.softBg,
                      borderRadius: 12,
                      border: `1px solid ${COLORS.softBorder}`,
                    }}
                  >
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 12 }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          background: `linear-gradient(135deg, ${COLORS.primaryA} 0%, ${COLORS.primaryB} 100%)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <CreditCardOutlined
                          style={{ fontSize: 18, color: '#fff' }}
                        />
                      </div>
                      <div>
                        <div
                          style={{
                            color: COLORS.textMuted,
                            fontSize: 13,
                            marginBottom: 2,
                          }}
                        >
                          Phương thức thanh toán
                        </div>
                        <Text strong style={{ fontSize: 15 }}>
                          {pm}
                        </Text>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Time */}
                  {eta && (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: 14,
                        background: COLORS.softBg,
                        borderRadius: 12,
                        border: `1px solid ${COLORS.softBorder}`,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                        }}
                      >
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 10,
                            background: `linear-gradient(135deg, ${COLORS.primaryA} 0%, ${COLORS.primaryB} 100%)`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <ClockCircleOutlined
                            style={{ fontSize: 18, color: '#fff' }}
                          />
                        </div>
                        <div>
                          <div
                            style={{
                              color: COLORS.textMuted,
                              fontSize: 13,
                              marginBottom: 2,
                            }}
                          >
                            Thời gian giao dự kiến
                          </div>
                          <Text strong style={{ fontSize: 15 }}>
                            {eta}
                          </Text>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <Text
                  type="secondary"
                  style={{ fontSize: 12, display: 'block', marginBottom: 16 }}
                >
                  * Đã bao gồm VAT nếu có
                </Text>

                <Button
                  type="primary"
                  size="large"
                  block
                  icon={<HomeOutlined />}
                  onClick={() => navigate('/')}
                  style={{
                    height: 48,
                    borderRadius: 12,
                    fontSize: 16,
                    fontWeight: 600,
                    background: `linear-gradient(135deg, ${COLORS.primaryA} 0%, ${COLORS.primaryB} 100%)`,
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(14,165,233,0.35)',
                  }}
                >
                  Về trang chủ
                </Button>
              </div>
            </Card>
          </Col>

          {/* RIGHT */}
          <Col xs={24} lg={8}>
            <Card
              style={{
                borderRadius: 16,
                marginBottom: 24,
                boxShadow: '0 8px 30px rgba(2,6,23,0.06)',
                border: `1px solid ${COLORS.softBorder}`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 4,
                    }}
                  >
                    <ShoppingOutlined
                      style={{ color: COLORS.primaryText, fontSize: 18 }}
                    />
                    <Text strong style={{ fontSize: 16 }}>
                      Sản phẩm đã mua
                    </Text>
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Mã: {code}
                  </Text>
                </div>
                <Button
                  type="link"
                  onClick={() => navigate(`/orders/${code}`)}
                  style={{
                    padding: '4px 12px',
                    height: 'auto',
                    fontWeight: 500,
                    color: COLORS.primaryText,
                  }}
                >
                  Chi tiết →
                </Button>
              </div>

              <Divider style={{ margin: '12px 0' }} />

              {items.length > 0 ? (
                <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                  {items.map((item, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        gap: 12,
                        padding: 12,
                        marginBottom: 8,
                        background: COLORS.softBg,
                        borderRadius: 12,
                        border: `1px solid ${COLORS.softBorder}`,
                        transition: 'all .2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateX(2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateX(0)';
                      }}
                    >
                      <Image
                        src={
                          item.image
                            ? item.image.startsWith('http')
                              ? item.image
                              : `http://localhost:3000${item.image}`
                            : '/placeholder.png'
                        }
                        alt={item.name}
                        width={60}
                        height={60}
                        style={{
                          borderRadius: 10,
                          objectFit: 'cover',
                          border: '2px solid #fff',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                        }}
                        preview={false}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Text
                          ellipsis
                          style={{
                            display: 'block',
                            fontWeight: 500,
                            marginBottom: 4,
                            fontSize: 14,
                          }}
                        >
                          {item.name}
                        </Text>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <Tag color="blue" style={{ margin: 0, fontSize: 12 }}>
                            x{item.quantity}
                          </Tag>
                          {item.price && (
                            <Text
                              strong
                              style={{
                                color: COLORS.primaryText,
                                fontSize: 13,
                              }}
                            >
                              {fmt(item.price)}
                            </Text>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '36px 16px',
                    color: COLORS.textMuted,
                  }}
                >
                  <ShoppingOutlined
                    style={{ fontSize: 44, marginBottom: 8, opacity: 0.35 }}
                  />
                  <div>Không có sản phẩm nào trong đơn</div>
                </div>
              )}
            </Card>

            <Card
              style={{
                borderRadius: 16,
                background: `linear-gradient(135deg, ${COLORS.primaryA} 0%, ${COLORS.primaryB} 100%)`,
                border: 'none',
                boxShadow: '0 8px 30px rgba(14,165,233,0.25)',
              }}
            >
              <div style={{ color: '#fff' }}>
                <Title level={5} style={{ color: '#fff', marginBottom: 8 }}>
                  📱 Tải ứng dụng EveryMart
                </Title>
                <Text
                  style={{
                    color: 'rgba(255,255,255,0.9)',
                    fontSize: 13,
                    display: 'block',
                    marginBottom: 14,
                  }}
                >
                  Trải nghiệm mua sắm tiện lợi hơn với ứng dụng di động
                </Text>
                <div
                  style={{ display: 'flex', gap: 8, justifyContent: 'center' }}
                >
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
    </div>
  );
};

export default OrderSuccess;
