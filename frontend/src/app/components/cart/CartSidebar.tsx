import React, { useState } from 'react';
import { Card, Typography, Button, Tag, message, Modal } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { api } from '../../api/api';
import { CheckoutItem } from '../../types/checkout';
import { useAuth } from '../../context/AuthContext';
import { PaymentMethodResponse } from '../../types/payment';
import { UserAddress } from '../../types/user';
import { CartItem } from '../../types/cart';

const { Text } = Typography;

type Props = {
  selectedTotal: number;
  selectedCount: number;
  mode?: 'cart' | 'checkout';
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
  mode = 'cart',
  submitLabel,
  selectedPaymentMethod,
  paymentMethods = [],
  shippingMethod,
  userAddress,
  items = [],
  etaLabel,
  onSubmit,
}) => {
  const { cart } = useCart() as { cart: CartItem[] };
  const navigate = useNavigate();
  const { me } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      console.log('Items received: ', JSON.stringify(items, null, 2));

      // Kiểm tra dữ liệu đầu vào
      if (items.length === 0) {
        message.error('Không có sản phẩm trong đơn hàng');
        return;
      }

      if (!userAddress || !userAddress.id) {
        message.error('Vui lòng chọn địa chỉ giao hàng');
        return;
      }

      const userId = me?.id || Number(localStorage.getItem('userId') || 0);
      if (!userId) {
        message.error('Vui lòng đăng nhập để đặt hàng');
        navigate('/login');
        return;
      }

      if (userAddress.userId !== userId) {
        message.error('Địa chỉ không thuộc về người dùng hiện tại.');
        navigate('/user/address');
        return;
      }

      if (paymentMethods.length === 0 || !selectedPaymentMethod) {
        message.error('Vui lòng chọn phương thức thanh toán');
        return;
      }

      const storeId = items[0]?.product?.store?.id || 1;
      const shippingFee = shippingMethod === 'economy' ? 0 : 22000;

      // Tạo payload cho đơn hàng
      const orderPayload = {
        userId,
        storeId,
        addressId: Number(userAddress.id),
        totalAmount: Number(selectedTotal),
        shippingFee,
        discountTotal: 0,
        items: items.map((item, index) => {
          const productId = Number(item.product?.id);
          if (isNaN(productId) || productId <= 0) {
            throw new Error(`Sản phẩm không hợp lệ tại vị trí ${index}: ${item.product?.id}`);
          }
          return {
            productId,
            variantId: item.product?.variants?.[0].id,
            quantity: Number(item.quantity),
            price: Number(item.price),
            ...(item.variant?.id && { variantId: Number(item.variant.id) }),
          };
        }),
      };

      console.log('Tạo đơn hàng:', JSON.stringify(orderPayload, null, 2));
      const orderRes = await api.post('/orders', orderPayload);
      const order = orderRes.data;
      console.log('Đơn hàng đã được tạo:', order);

      const selectedMethod = paymentMethods.find((m) => m.type === selectedPaymentMethod);

      if (!selectedMethod) {
        message.error(`Không tìm thấy phương thức thanh toán: ${selectedPaymentMethod}`);
        return;
      }

      const orderUuid = order.uuid || String(order.id);
      const paymentPayload = {
        orderUuid,
        paymentMethodUuid: selectedMethod.uuid,
        amount: Number(selectedTotal),
      };

      console.log('💳 Tạo thanh toán:', JSON.stringify(paymentPayload, null, 2));
      const paymentRes = await api.post('/payments', paymentPayload);
      const { redirectUrl, payment } = paymentRes.data;

      console.log('💳 Kết quả thanh toán:', paymentRes.data);

      const successState = {
        orderCode: order.uuid || order.id,
        total: selectedTotal,
        paymentMethodLabel: selectedMethod.name,
        etaLabel,
        items,
        status: selectedMethod.type === 'cod' ? 'success' : (payment?.status ?? 'success'),
      };

      console.log('Navigating to OrderSuccess with state:', successState);

      if (redirectUrl) {
        console.log('🔗 Chuyển hướng đến:', redirectUrl);
        window.location.href = redirectUrl;
      } else {
        console.log('✅ Không cần chuyển hướng, chuyển đến trang thành công');
        navigate('/order-success', {
          state: {
            orderCode: order.uuid || order.id,
            total: selectedTotal,
            paymentMethodLabel: selectedMethod.name,
            etaLabel,
            items,
            status: payment?.status ?? 'success',
          },
          replace: true,
        });
      }
    } catch (err: any) {
      console.error('Lỗi tạo đơn hàng/thanh toán:', {
        status: err.status,
        data: err.data,
        message: err.message,
        url: err.config?.url,
      });
      message.error(err.message || 'Không thể tạo đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const showConfirmModal = () => {
    setIsModalVisible(true);
  };

  const handleModalConfirm = () => {
    setIsModalVisible(false);
    handleSubmit();
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
  };

  return (
    <div style={{ position: 'sticky', top: 24, maxWidth: 360, marginLeft: 'auto' }}>
      <Card style={{ marginBottom: 16 }}>
        <div className="flex justify-between items-center mb-2">
          <Text strong>Giao tới</Text>
          <Button type="link" size="small" onClick={() => navigate('/user/address')}>
            Thay đổi
          </Button>
        </div>
        {userAddress ? (
          <>
            <p>
              <Text strong>
                {userAddress.name ?? 'Người nhận'} | {userAddress.phone ?? 'Chưa có SĐT'}
              </Text>
            </p>
            <p>{userAddress.fullAddress}</p>
            {userAddress.tag && <Tag color="green">{userAddress.tag}</Tag>}
          </>
        ) : (
          <Text type="secondary">Vui lòng chọn địa chỉ giao hàng</Text>
        )}
      </Card>
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
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              border: '1px solid #1890ff',
              borderRadius: 6,
              padding: '8px 12px',
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
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              border: '1px solid #1890ff',
              borderRadius: 6,
              padding: '8px 12px',
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
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Text>Tổng tiền hàng ({selectedCount})</Text>
          <Text>{selectedTotal.toLocaleString()}đ</Text>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          <Text strong>Tổng thanh toán</Text>
          <Text strong style={{ color: 'red', fontSize: 18 }}>
            {selectedTotal.toLocaleString()}đ
          </Text>
        </div>
        <Button
          type="primary"
          block
          size="large"
          style={{ marginTop: 16, borderRadius: 6 }}
          disabled={selectedCount === 0 || loading}
          onClick={mode === 'checkout' ? showConfirmModal : onSubmit}
          loading={loading}
        >
          {submitLabel ?? (mode === 'checkout' ? 'Đặt hàng' : `Mua Hàng (${selectedCount})`)}
        </Button>
      </Card>

      <Modal
        title="Xác nhận đơn hàng"
        visible={isModalVisible}
        onOk={handleModalConfirm}
        onCancel={handleModalCancel}
        okText="Xác nhận"
        cancelText="Hủy"
        width={600}
      >
        <div>
          <Text strong>Thông tin giao hàng</Text>
          {userAddress ? (
            <div style={{ marginTop: 8 }}>
              <p>
                <Text strong>
                  {userAddress.name ?? 'Người nhận'} | {userAddress.phone ?? 'Chưa có SĐT'}
                </Text>
              </p>
              <p>{userAddress.fullAddress}</p>
              {userAddress.tag && <Tag color="green">{userAddress.tag}</Tag>}
            </div>
          ) : (
            <Text type="secondary">Chưa chọn địa chỉ giao hàng</Text>
          )}

          <div style={{ marginTop: 16 }}>
            <Text strong>Phương thức thanh toán</Text>
            <p>
              {paymentMethods.find((m) => m.type === selectedPaymentMethod)?.name ??
                'Chưa chọn phương thức thanh toán'}
            </p>
          </div>

          <div style={{ marginTop: 16 }}>
            <Text strong>Thông tin đơn hàng</Text>
            {items.map((item, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: 8,
                }}
              >
                <Text>
                  {item.product?.name} {item.variant?.variant_name ? `(${item.variant.variant_name})` : ''} x{' '}
                  {item.quantity}
                </Text>
                <Text>{Number(item.price) * Number(item.quantity)}đ</Text>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between' }}>
            <Text strong>Tổng thanh toán</Text>
            <Text strong style={{ color: 'red', fontSize: 16 }}>
              {selectedTotal.toLocaleString()}đ
            </Text>
          </div>

          {etaLabel && (
            <div style={{ marginTop: 16 }}>
              <Text strong>Thời gian giao hàng dự kiến</Text>
              <p>{etaLabel}</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default CartSidebar;