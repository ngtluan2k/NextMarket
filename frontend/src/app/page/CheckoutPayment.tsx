import React, { useMemo, useState, useEffect } from 'react';
import { Row, Col, Typography, message, Spin } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../../config/api';

import EveryMartHeader from '../components/Navbar';
import Footer from '../components/Footer';
import { CartSidebar } from '../components/cart/CartSidebar';
import {
  ShippingMethod,
  ShippingMethodType,
  CheckoutItem,
} from '../components/checkout/ShippingMethod';
import PaymentMethods, {
  PaymentMethodType,
  PaymentMethodResponse,
  SavedCard,
} from '../components/checkout/PaymentMethods';
import { Product } from '../components/productDetail/product';

const { Title } = Typography;

type CheckoutLocationState = {
  items?: Array<{
    id: number;
    product_id: number;
    price: number | string;
    quantity: number;
    product: Product;
  }>;
  subtotal?: number | string;
};

const CheckoutPayment: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {
    items: [],
    subtotal: 0,
  }) as CheckoutLocationState;

  const items = state.items ?? [];
  const subtotalNum =
    typeof state.subtotal === 'string'
      ? Number(state.subtotal)
      : state.subtotal ?? 0;

  // Map dữ liệu cho ShippingMethod
  const checkoutItems: CheckoutItem[] = useMemo(() => {
    return items.map((i) => {
      const primaryImage =
        i.product.media?.find((m) => m.is_primary)?.url ??
        i.product.media?.[0]?.url ??
        '';
      return {
        id: i.id,
        name: i.product.name ?? 'Sản phẩm không xác định',
        image: primaryImage,
        quantity: i.quantity,
        price: i.price,
      };
    });
  }, [items]);

  useEffect(() => {
    if (items.length === 0) {
      message.warning('Giỏ hàng trống! Vui lòng thêm sản phẩm.');
      navigate('/cart');
    }
  }, [items, navigate]);

  // Shipping
  const [shippingMethod, setShippingMethod] =
    useState<ShippingMethodType>('economy');
  const shippingFee = shippingMethod === 'economy' ? 0 : 22000;
  const etaDate = new Date(
    Date.now() + (shippingMethod === 'economy' ? 3 : 1) * 24 * 60 * 60 * 1000
  );
  const etaLabel = `Giao ${etaDate.toLocaleDateString('vi-VN', {
    weekday: 'short',
    day: 'numeric',
    month: 'numeric',
  })}`;

  // Payment
  const [method, setMethod] = useState<PaymentMethodType>('cod');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodResponse[]>([]);
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [userAddress, setUserAddress] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const total = useMemo(
    () => subtotalNum + (shippingFee || 0),
    [subtotalNum, shippingFee]
  );
  const selectedCount = useMemo(
    () => items.reduce((s, it) => s + it.quantity, 0),
    [items]
  );

  // Lấy dữ liệu từ API
  useEffect(() => {
    const userId = parseInt(localStorage.getItem('userId') || '1');

    const fetchAllPaymentMethods = async () => {
      try {
        const response = await api.get<PaymentMethodResponse[]>('/payment-methods');

        const systemMethods: PaymentMethodResponse[] = [];
        const userCards: SavedCard[] = [];

        response.data.forEach((pm) => {
          if (!pm.enabled) return;

          if (pm.type === 'user_card') {
            if (pm.config?.userId === userId) {
              userCards.push({
                id: pm.id,
                brand: pm.config.brand || 'Unknown',
                last4: pm.config.last4 || '****',
                exp: pm.config.exp || 'N/A',
              });
            }
          } else {
            systemMethods.push(pm);
          }
        });

        setPaymentMethods(systemMethods);
        setSavedCards(userCards);

        // Chọn phương thức mặc định
        if (systemMethods.length > 0) {
          setMethod(
            systemMethods.find((m) => m.type === 'cod')?.type ||
              systemMethods[0].type
          );
        }
      } catch (error) {
        console.error('❌ Lỗi tải phương thức thanh toán:', error);
        message.error('Không thể tải phương thức thanh toán.');
        setPaymentMethods([]);
      }
    };

    const fetchUserAddress = async () => {
      try {
        const response = await api.get('/user-address');
        const addresses = (response.data || []).filter(
          (a: any) => a.user_id === userId
        );
        if (addresses.length > 0) {
          const addr = addresses.find((a: any) => a.isDefault) || addresses[0];
          setUserAddress({
            id: addr.id,
            fullAddress: `${addr.street}, ${addr.city}, ${addr.province}, ${addr.country}`,
            name: addr.recipientName,
            phone: addr.phone,
            tag: addr.isDefault ? 'Mặc định' : undefined,
          });
        }
      } catch (error) {
        console.error('❌ Lỗi tải địa chỉ:', error);
        message.error('Không thể tải địa chỉ giao hàng.');
      }
    };

    Promise.all([fetchAllPaymentMethods(), fetchUserAddress()]).finally(() =>
      setLoading(false)
    );
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>Đang tải thông tin thanh toán...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <EveryMartHeader />
      <main className="mx-auto w-full max-w-[1280px] px-4 lg:px-6 py-6 flex-1">
        <Title level={3} style={{ marginBottom: 16 }}>
          THANH TOÁN
        </Title>

        <Row gutter={24} align="top" wrap={false}>
          <Col flex="1">
            <ShippingMethod
              items={checkoutItems}
              selected={shippingMethod}
              onChange={setShippingMethod}
              etaLabel={etaLabel}
              storeName={items[0]?.product?.store?.name ?? 'EveryMart'}
              saving={0}
              shippingFee={shippingFee}
            />

            <div style={{ marginTop: 12 }}>
              <PaymentMethods
                selected={method}
                onChange={setMethod}
                methods={paymentMethods}
                savedCards={savedCards}
              />
            </div>
          </Col>

          <Col flex="320px">
            <CartSidebar
              mode="checkout"
              selectedTotal={total}
              selectedCount={selectedCount}
              submitLabel="Đặt hàng"
              selectedPaymentMethod={method} // Truyền phương thức thanh toán được chọn
              paymentMethods={paymentMethods} // Truyền danh sách phương thức thanh toán
              shippingMethod={shippingMethod} // Truyền phương thức vận chuyển
              userAddress={userAddress} // Truyền địa chỉ người dùng
              items={checkoutItems} // Truyền danh sách sản phẩm
              etaLabel={etaLabel} // Truyền nhãn ETA
            />
          </Col>
        </Row>
      </main>
      <Footer />
    </div>
  );
};

export default CheckoutPayment;
