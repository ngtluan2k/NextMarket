import React, { useMemo, useState, useEffect } from 'react';
import { Row, Col, Typography, message, Spin, Button } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/api';
import EveryMartHeader from '../components/Navbar';
import Footer from '../components/Footer';
import { CartSidebar } from '../components/cart/CartSidebar';
import {
  ShippingMethod,
  ShippingMethodType,
} from '../components/checkout/ShippingMethod';
import PaymentMethods from '../components/checkout/PaymentMethods';
import {
  PaymentMethodType,
  PaymentMethodResponse,
  SavedCard,
} from '../types/payment';
import LoginModal from '../components/LoginModal';
import { CheckoutLocationState } from '../types/buyBox';
import { CheckoutItem } from '../types/checkout';
import { UserAddress } from '../types/user';

const { Title } = Typography;

const CheckoutPayment: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { me } = useAuth();
  const state = (location.state ?? {
    items: [],
    subtotal: 0,
  }) as CheckoutLocationState;
  // Payment
  const [method, setMethod] = useState<PaymentMethodType>('cod');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodResponse[]>(
    []
  );
  const [showLoginModal, setShowLoginModal] = useState(false);
  const items = state.items ?? [];
  const subtotalNum =
    typeof state.subtotal === 'string'
      ? Number(state.subtotal)
      : state.subtotal ?? 0;

  const checkoutItems: CheckoutItem[] = useMemo(() => {
    return items.map((i) => {
      const primaryImage =
        i.product.media?.find((m) => m.is_primary)?.url ??
        i.product.media?.[0]?.url ??
        '';
      const variant =
        i.variant && i.variant.id && i.variant.variant_name && i.variant.price
          ? {
              id: i.variant.id,
              variant_name: i.variant.variant_name,
              price: i.variant.price,
            }
          : undefined;
      return {
        id: i.id,
        name: i.product.name ?? 'Sản phẩm không xác định',
        image: primaryImage,
        quantity: i.quantity,
        price: i.price,
        type: i.type,
        product: i.product,
        variant,
      };
    });
  }, [items]);

  // Kiểm tra có subscription hay không
  const isSubscription = useMemo(
    () => checkoutItems.some((i) => i.type === 'subscription'),
    [checkoutItems]
  );

  // Lọc payment methods cho COD ↔ EveryCoin
  const filteredMethods = useMemo(
    () =>
      paymentMethods.filter((m) => {
        if (m.type === 'cod') return !isSubscription;
        if (m.type === 'everycoin') return isSubscription;
        return true; // các method khác luôn hiển thị
      }),
    [paymentMethods, isSubscription]
  );

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

  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [userAddress, setUserAddress] = useState<UserAddress | null>(null);
  const [loading, setLoading] = useState(true);

  const handleAddressChange = (addr: UserAddress) => {
    setUserAddress(addr);
  };

  const total = useMemo(
    () => subtotalNum + (shippingFee || 0),
    [subtotalNum, shippingFee]
  );
  const selectedCount = useMemo(
    () => items.reduce((s, it) => s + it.quantity, 0),
    [items]
  );

  useEffect(() => {
    const token = localStorage.getItem('token');

    // FIX: Đảm bảo userId luôn là số hợp lệ
    const storedUserId = localStorage.getItem('userId');
    const userId = me?.user_id || (storedUserId ? parseInt(storedUserId, 10) : 0);

    // Kiểm tra userId hợp lệ
    if (!token || !userId || isNaN(userId)) {
      console.log('🔐 No valid token or userId, showing login modal');
      localStorage.setItem(
        'checkoutData',
        JSON.stringify({ items, subtotal: subtotalNum })
      );
      localStorage.setItem('returnUrl', location.pathname);
      setShowLoginModal(true);
      setLoading(false);
      return;
    }

    const fetchAllPaymentMethods = async () => {
      try {
        const response = await api.get<PaymentMethodResponse[]>(
          '/payment-methods'
        );
        const systemMethods: PaymentMethodResponse[] = [];
        const userCards: SavedCard[] = [];

        response.data.forEach((pm) => {
          if (!pm.enabled) return;
          if (pm.type === 'user_card' && pm.config?.userId === userId) {
            userCards.push({
              id: pm.id,
              brand: pm.config.brand || 'Unknown',
              last4: pm.config.last4 || '****',
              exp: pm.config.exp || 'N/A',
            });
          } else {
            systemMethods.push(pm);
          }
        });

        setPaymentMethods(systemMethods);
        setSavedCards(userCards);
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

    // Kiểm tra có subscription hay không
    const isSubscription = checkoutItems.some((i) => i.type === 'subscription');

    // Lọc payment methods cho COD ↔ EveryCoin
    const filteredMethods = paymentMethods.filter((m) => {
      if (m.type === 'cod') return !isSubscription; // COD chỉ hiện khi không phải subscription
      if (m.type === 'everycoin') return isSubscription; // EveryCoin chỉ hiện khi là subscription
      return true; // các method khác luôn hiển thị
    });

    const fetchUserAddress = async () => {
      try {
        console.log('📍 Fetching address for userId:', userId);
        const response = await api.get(`/users/${userId}/addresses`);
        const addresses = response.data || [];

        if (addresses.length > 0) {
          // Tìm địa chỉ mặc định hoặc lấy địa chỉ đầu tiên
          const defaultAddr =
            addresses.find((a: any) => a.isDefault) || addresses[0];

          setUserAddress({
            id: defaultAddr.id,
            userId: userId, // FIX: Đảm bảo userId là số hợp lệ
            recipientName: defaultAddr.recipientName,
            phone: defaultAddr.phone,
            street: defaultAddr.street,
            ward: defaultAddr.ward,
            district: defaultAddr.district,
            province: defaultAddr.province,
            country: defaultAddr.country,
            postalCode: defaultAddr.postalCode,
            isDefault: defaultAddr.isDefault,
            fullAddress: [
              defaultAddr.street,
              defaultAddr.ward,
              defaultAddr.district,
              defaultAddr.province,
              defaultAddr.country,
            ]
              .filter(Boolean)
              .join(', '),
            tag: defaultAddr.isDefault ? 'Mặc định' : undefined,
          });
        } else {
          message.warning(
            'Bạn chưa có địa chỉ giao hàng. Vui lòng thêm địa chỉ.'
          );
          navigate('/user/address');
        }
      } catch (error) {
        console.error('❌ Lỗi tải địa chỉ:', error);
        message.error('Không thể tải địa chỉ giao hàng.');
      }
    };

    Promise.all([fetchAllPaymentMethods(), fetchUserAddress()]).finally(() =>
      setLoading(false)
    );
  }, [navigate, me, location.pathname, items, subtotalNum]);

  const handleLoginSuccess = () => {
    setShowLoginModal(false);
    const checkoutData = localStorage.getItem('checkoutData');
    if (checkoutData) {
      const parsedData = JSON.parse(checkoutData);
      navigate('/checkout', { state: parsedData });
      localStorage.removeItem('checkoutData');
      localStorage.removeItem('returnUrl');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>Đang tải thông tin thanh toán...</div>
      </div>
    );
  }

  if (!userAddress) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <div>Không có địa chỉ giao hàng.</div>
        <Button type="primary" onClick={() => navigate('/user/address')}>
          Thêm địa chỉ mới
        </Button>
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
                methods={filteredMethods}
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
              selectedPaymentMethod={method}
              paymentMethods={paymentMethods}
              shippingMethod={shippingMethod}
              userAddress={userAddress}
              onAddressChange={handleAddressChange}
              items={checkoutItems}
              etaLabel={etaLabel}
            />
          </Col>
        </Row>
      </main>
      <Footer />
      <LoginModal
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        title="Đăng nhập để tiếp tục thanh toán"
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
};

export default CheckoutPayment;
