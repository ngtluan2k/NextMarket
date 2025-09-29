import React, { useEffect, useState } from 'react';
import { Card, Typography, Button, Tag, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { api } from '../../config/api';
import { CheckoutItem } from '../../components/checkout/ShippingMethod';
import { useAuth } from '../../context/AuthContext';

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
  userId?: number;
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
  mode?: 'cart' | 'checkout';
  submitLabel?: string;
  selectedPaymentMethod?: string;
  paymentMethods?: PaymentMethodResponse[];
  shippingMethod?: string;
  userAddress?: UserAddress | null;
  items?: CheckoutItem[];
  etaLabel?: string;
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
}) => {
  const { cart } = useCart() as { cart: CartItem[] };
  const navigate = useNavigate();
  const { me } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      console.log('📋 Items received:', JSON.stringify(items, null, 2));

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

      const invalidItems = items.filter(
        (item) => !item.id || isNaN(Number(item.id)) || Number(item.id) <= 0
      );
      if (invalidItems.length > 0) {
        console.error('❌ Invalid items:', JSON.stringify(invalidItems, null, 2));
        message.error('Một số sản phẩm có ID không hợp lệ');
        return;
      }

      const storeId = items[0]?.product?.store?.id || 1;
      const shippingFee = shippingMethod === 'economy' ? 0 : 22000;

      const orderPayload = {
        userId,
        storeId,
        addressId: Number(userAddress.id),
        totalAmount: Number(selectedTotal),
        shippingFee,
        discountTotal: 0,
        items: items.map((item, index) => {
          const productId = Number(item.id);
          if (isNaN(productId) || productId <= 0) {
            throw new Error(`Invalid productId at index ${index}: ${item.id}`);
          }
          return {
            productId,
            quantity: Number(item.quantity),
            price: Number(item.price),
            ...(item.product?.variants?.[0]?.id
              ? { variantId: Number(item.product.variants[0].id) }
              : {}),
          };
        }),
      };

      console.log('📦 Tạo đơn hàng:', JSON.stringify(orderPayload, null, 2));
      const orderRes = await api.post('/orders', orderPayload);
      const order = orderRes.data;
      console.log('📦 Đơn hàng đã được tạo:', order);

      const selectedMethod = paymentMethods.find(
        (m) => m.type === selectedPaymentMethod
      );

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

      if (redirectUrl) {
        console.log('🔗 Chuyển hướng đến:', redirectUrl);
        window.location.href = redirectUrl;
      } else {
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
      console.error('❌ Lỗi tạo đơn hàng/thanh toán:', {
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
                {userAddress.name ?? 'Người nhận'} |{' '}
                {userAddress.phone ?? 'Chưa có SĐT'}
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
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 8,
          }}
        >
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
          onClick={handleSubmit}
          loading={loading}
        >
          {submitLabel ?? (mode === 'checkout' ? 'Đặt hàng' : `Mua Hàng (${selectedCount})`)}
        </Button>
      </Card>
    </div>
  );
};

export default CartSidebar;