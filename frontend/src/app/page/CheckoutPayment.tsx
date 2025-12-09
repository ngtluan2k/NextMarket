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
import { Voucher } from '../types/voucher';

const { Title } = Typography;

const CheckoutPayment: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { me } = useAuth();
  const state = (location.state ?? {
    items: [],
    subtotal: 0,
  }) as CheckoutLocationState;
  
  const [method, setMethod] = useState<PaymentMethodType>('cod');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodResponse[]>([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [shippingMethod, setShippingMethod] = useState<ShippingMethodType>('economy');
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [userAddress, setUserAddress] = useState<UserAddress | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVouchers, setSelectedVouchers] = useState<Voucher[]>([]);
  const [discountTotal, setDiscountTotal] = useState(0);
  const [shippingFee, setShippingFee] = useState<number>(0);
  const [calculatingShipping, setCalculatingShipping] = useState(false);

  const items = state.items ?? [];
  const subtotalNum = typeof state.subtotal === 'string'
    ? Number(state.subtotal)
    : state.subtotal ?? 0;

  const checkoutItems: CheckoutItem[] = useMemo(() => {
    return items.map((i) => {
      const primaryImage = i.product.media?.find((m) => m.is_primary)?.url ??
        i.product.media?.[0]?.url ?? '';

      const variant = i.variant && i.variant.id && i.variant.variant_name && i.variant.price
        ? {
            id: i.variant.id,
            variant_name: i.variant.variant_name,
            price: i.variant.price,
            weight: i.variant.weight ?? 200,
          }
        : undefined;

      const pricing_rule = i.pricing_rule?.id !== undefined
        ? { id: Number(i.pricing_rule.id) }
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
        pricing_rule,
      };
    });
  }, [items]);

  const isSubscription = useMemo(
    () => checkoutItems.some((i) => i.type === 'subscription'),
    [checkoutItems]
  );

  const filteredMethods = useMemo(
    () =>
      paymentMethods.filter((m) => {
        if (m.type === 'cod') return !isSubscription;
        if (m.type === 'everycoin') return isSubscription;
        return true;
      }),
    [paymentMethods, isSubscription]
  );

  useEffect(() => {
    if (items.length === 0) {
      message.warning('Giỏ hàng trống! Vui lòng thêm sản phẩm.');
      navigate('/cart');
    }
  }, [items, navigate]);

  // Tính phí ship dựa trên địa chỉ và phương thức
  const calculateShippingFee = async (method: ShippingMethodType): Promise<number> => {
    if (!userAddress || checkoutItems.length === 0) return 0;
    
    setCalculatingShipping(true);
    try {
      const storeId = checkoutItems[0]?.product?.store?.id;
      if (!storeId) return 0;
      
      const totalWeight = checkoutItems.reduce((sum, item) => {
        return sum + (item.variant?.weight || 200) * item.quantity;
      }, 0);
      
      const response = await api.post('/orders/calculate-shipping-fee', {
        storeId,
        addressId: userAddress.id,
        items: checkoutItems.map(item => ({
          productId: item.product?.id,
          variantId: item.variant?.id,
          quantity: item.quantity,
          weight: item.variant?.weight || 5000
        })),
        totalWeight,
        serviceType: method === 'fast' ? 2 : 1 // 1: Standard, 2: Express
      });
      
      const fee = response.data.data?.shippingFee || 0;
      setShippingFee(fee);
      return fee;
    } catch (error) {
      console.error('Lỗi tính phí ship:', error);
      message.warning('Không thể tính phí ship. Sử dụng phí mặc định.');
      const fallbackFee = method === 'economy' ? 0 : 30000;
      setShippingFee(fallbackFee);
      return fallbackFee;
    } finally {
      setCalculatingShipping(false);
    }
  };

  const handleAddressChange = async (addr: UserAddress) => {
    setUserAddress(addr);
    // Tính lại phí ship khi thay đổi địa chỉ
    if (checkoutItems.length > 0) {
      await calculateShippingFee(shippingMethod);
    }
  };

  const handleApplyVoucher = async (vouchers: Voucher[], partialDiscount: number) => {
    setSelectedVouchers(vouchers);

    if (vouchers.length === 0) {
      setDiscountTotal(0);
      return;
    }

    try {
      const payload = {
        voucherCodes: vouchers.map((v) => v.code),
        userId: me?.id,
        orderItems: checkoutItems.map((item) => ({
          productId: Number(item.product?.id),
          quantity: Number(item.quantity),
          price: Number(item.price),
        })),
        storeId: items[0]?.product?.store?.id,
        orderAmount: subtotalNum,
      };

      const res = await api.post('/vouchers/calculate-discount', payload);
      const { discountTotal: calculatedDiscount } = res.data;

      const safeDiscount = Number.isFinite(calculatedDiscount)
        ? calculatedDiscount
        : 0;
      setDiscountTotal(safeDiscount);
    } catch (error: any) {
      console.error('Error recalculating total discount:', error);
      message.error('Không thể tính toán giảm giá');
      setDiscountTotal(0);
    }
  };

  const handleRemoveVoucher = async (voucherId: number) => {
    const updatedVouchers = selectedVouchers.filter((v) => v.id !== voucherId);
    setSelectedVouchers(updatedVouchers);

    if (updatedVouchers.length === 0) {
      setDiscountTotal(0);
      return;
    }

    try {
      const res = await api.post('/vouchers/calculate-discount', {
        voucherCodes: updatedVouchers.map((v) => v.code),
        userId: me?.id,
        orderItems: checkoutItems.map((item) => ({
          productId: Number(item.product?.id),
          quantity: Number(item.quantity),
          price: Number(item.price),
        })),
        storeId: items[0]?.product?.store?.id,
        orderAmount: subtotalNum,
      });
      const { discountTotal } = res.data;
      setDiscountTotal(Number.isFinite(discountTotal) ? discountTotal : 0);
    } catch (error: any) {
      console.error('Error recalculating discount:', error);
      message.error('Không thể tính toán lại giảm giá');
      setDiscountTotal(0);
    }
  };

  const total = useMemo(
    () => subtotalNum - discountTotal + shippingFee,
    [subtotalNum, discountTotal, shippingFee]
  );

  const selectedCount = useMemo(
    () => items.reduce((s, it) => s + it.quantity, 0),
    [items]
  );

  useEffect(() => {
    if (!me) {
      localStorage.setItem(
        'checkoutData',
        JSON.stringify({ items, subtotal: subtotalNum })
      );
      localStorage.setItem('returnUrl', location.pathname);
      setShowLoginModal(true);
      setLoading(false);
      return;
    }

    const userId = me.user_id;

    const fetchAllPaymentMethods = async () => {
      try {
        const response = await api.get<PaymentMethodResponse[]>('/payment-methods');
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
        console.error('Lỗi tải phương thức thanh toán:', error);
        message.error('Không thể tải phương thức thanh toán.');
        setPaymentMethods([]);
      }
    };

    const fetchUserAddress = async () => {
      try {
        const response = await api.get(`/users/${userId}/addresses`);
        const addresses = response.data || [];
        if (addresses.length > 0) {
          const defaultAddr = addresses.find((a: any) => a.isDefault) || addresses[0];
          setUserAddress({
            id: defaultAddr.id,
            userId,
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
          
          // Tính phí ship ban đầu
          if (checkoutItems.length > 0) {
            await calculateShippingFee(shippingMethod);
          }
        } else {
          message.warning('Bạn chưa có địa chỉ giao hàng. Vui lòng thêm địa chỉ.');
          navigate('/account/addresses');
        }
      } catch (error) {
        console.error('Lỗi tải địa chỉ:', error);
        message.error('Không thể tải địa chỉ giao hàng.');
      }
    };

    Promise.all([fetchAllPaymentMethods(), fetchUserAddress()]).finally(() =>
      setLoading(false)
    );
  }, [me, navigate, location.pathname, items, subtotalNum]);

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
              etaLabel="Dự kiến giao trong 2-3 ngày"
              storeName={items[0]?.product?.store?.name ?? 'EveryMart'}
              saving={0}
              shippingFee={shippingFee}
              selectedVouchers={selectedVouchers}
              onApplyVoucher={handleApplyVoucher}
              discountTotal={discountTotal}
              orderAmount={subtotalNum}
              calculateShippingFee={calculateShippingFee}
              onShippingFeeCalculated={setShippingFee}
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
              selectedTotal={subtotalNum}
              selectedCount={selectedCount}
              submitLabel="Đặt hàng"
              selectedPaymentMethod={method}
              paymentMethods={paymentMethods}
              shippingMethod={shippingMethod}
              userAddress={userAddress}
              onAddressChange={handleAddressChange}
              items={checkoutItems}
              etaLabel="Dự kiến giao trong 2-3 ngày"
              selectedVouchers={selectedVouchers}
              discountTotal={discountTotal}
              onApplyVoucher={handleApplyVoucher}
              onRemoveVoucher={handleRemoveVoucher}
              shippingFee={shippingFee}
              onShippingFeeChange={setShippingFee}
              calculateShippingFee={() => calculateShippingFee(shippingMethod)}
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