import React from 'react';
import {
  Card,
  Button,
  Typography,
  Image,
  InputNumber,
  Divider,
  Row,
  Col,
  Empty,
} from 'antd';
import {
  ArrowLeftOutlined,
  DeleteOutlined,
  ShoppingOutlined,
} from '@ant-design/icons';
import { useCart } from '../context/CartContext';

const { Title, Text } = Typography;

interface CartProps {
  showMessage?: (
    type: 'success' | 'error' | 'warning',
    content: string
  ) => void;
}

export const Cart: React.FC<CartProps> = ({ showMessage }) => {
  const { cart, removeFromCart, updateQuantity } = useCart();
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleRemoveFromCart = (productId: number, productName: string) => {
    try {
      removeFromCart(productId);
      showMessage?.('success', `Removed ${productName} from cart successfully`);
    } catch (error) {
      showMessage?.('error', `Failed to remove ${productName} from cart`);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '24px',
        backgroundColor: '#f5f5f5',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 32,
          }}
        >
          <Button
            icon={<ArrowLeftOutlined />}
            type="text"
            size="large"
            onClick={() => window.history.back()}
          />
          <div>
            <Title level={1} style={{ margin: 0 }}>
              Giỏ hàng của bạn
            </Title>
            <Text type="secondary" style={{ fontSize: '16px' }}>
              {cart.length} {cart.length === 1 ? 'item' : 'items'} in your cart
            </Text>
          </div>
        </div>

        {cart.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: '64px 24px' }}>
            <Empty
              image={
                <ShoppingOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />
              }
              description={
                <div>
                  <Title level={3}>Giỏ hàng của bạn trống</Title>
                  <Text type="secondary">
                    Cùng mua sắm để nhận được nhiều ưu đãi
                  </Text>
                </div>
              }
            >
              <Button
                type="primary"
                size="large"
                style={{ marginTop: 16 }}
                onClick={() => window.history.back()}
              >
                Tiếp tục mua sắm

              </Button>
            </Empty>
          </Card>
        ) : (
          <Row gutter={24}>
            <Col xs={24} lg={16}>
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
              >
                {cart.map((item) => {
                  console.log(item); // Xem dữ liệu từng item trên console
                  return (
                    <Card key={item.id} style={{ borderRadius: 12 }}>
                      <div></div>
                      <div style={{ display: 'flex', gap: 16 }}>
                        <div style={{ width: 80, height: 80, flexShrink: 0 }}>
                          <Image
                            src={
                              Array.isArray(item.product.media)
                                ? item.product.media.find(
                                    (m: { is_primary?: boolean }) =>
                                      m.is_primary
                                  )?.url ||
                                  item.product.media[0]?.url ||
                                  ''
                                : item.product.media?.url || ''
                            }
                            alt={item.product.name}
                            width={80}
                            height={80}
                            style={{ borderRadius: 8, objectFit: 'cover' }}
                            preview={false}
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Title
                            level={4}
                            style={{ margin: '0 0 8px 0' }}
                            ellipsis
                          >
                            {item.product.name}
                          </Title>
                          <Text
                            strong
                            style={{ fontSize: '18px', color: '#1890ff' }}
                          >
                            ${item.price}
                          </Text>

                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginTop: 16,
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                              }}
                            >
                              <Text>Quantity:</Text>
                              <InputNumber
                                min={1}
                                value={item.quantity}
                                onChange={(value) =>
                                  updateQuantity(item.product_id, value || 1)
                                }
                                style={{ width: 80 }}
                              />
                            </div>

                            <Button
                              type="text"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() =>
                                handleRemoveFromCart(
                                  item.product_id,
                                  item.product.name
                                )
                              }
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </Col>

            <Col xs={24} lg={8}>
              <Card
                title="Order Summary"
                style={{ borderRadius: 12, position: 'sticky', top: 24 }}
              >
                <div style={{ marginBottom: 16 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: 8,
                    }}
                  >
                    <Text>Tạm tính</Text>
                    <Text>${total}</Text>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: 8,
                    }}
                  >
                    <Text>Phí ship</Text>
                    <Text>Miễn phí</Text>
                  </div>
                </div>

                <Divider />

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 24,
                  }}
                >
                  <Text strong style={{ fontSize: '18px' }}>
                    Tổng
                  </Text>
                  <Text strong style={{ fontSize: '18px' }}>
                    ${total}
                  </Text>
                </div>

                <Button
                  type="primary"
                  size="large"
                  block
                  style={{ borderRadius: 8 }}
                >
                  Thanh toán ngay
                </Button>
              </Card>
            </Col>
          </Row>
        )}
      </div>
    </div>
  );
};
