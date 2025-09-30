// src/pages/CartPage.tsx
import React, { Suspense, useMemo, useState } from 'react';
import EveryMartHeader from '../components/Navbar';
import Footer from '../components/Footer';
import { useNavigate } from 'react-router-dom';

import { CartHeader } from '../components/cart/CartHeader';
import { CartRecommendation } from '../components/cart/CartRecommendation';
import { CartSidebar } from '../components/cart/CartSidebar';

import { Row, Col, Typography, Button, Spin } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useCart } from '../context/CartContext';
import { CheckoutItem } from '../components/checkout/ShippingMethod';

const { Title } = Typography;

interface CartProps {
  showMessage?: (
    type: 'success' | 'error' | 'warning',
    content: string
  ) => void;
}

const CartPage: React.FC<CartProps> = ({ showMessage }) => {
  const { cart } = useCart();
  const navigate = useNavigate();

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const allIds = useMemo(() => cart.map((i) => i.id), [cart]);

  const allChecked = selectedIds.length === allIds.length && allIds.length > 0;
  const indeterminate =
    selectedIds.length > 0 && selectedIds.length < allIds.length;

  const selectedCartItems = cart.filter((item) =>
    selectedIds.includes(item.id)
  );

  // 🔹 Tạo checkout items với variant + inventory
const selectedCheckoutItems: CheckoutItem[] = selectedCartItems.map((item) => ({
  id: item.id,
  name: item.product.name,
  image: Array.isArray(item.product.media)
    ? item.product.media[0]?.url ?? ''
    : item.product.media?.url ?? '',
  quantity: item.quantity,
  price: item.price,
  product: {
    ...item.product,
    media: Array.isArray(item.product.media)
      ? item.product.media
      : item.product.media
      ? [item.product.media]
      : [],
  },
}));



  const selectedTotal = useMemo(
    () =>
      selectedCartItems.reduce(
        (sum, i) => sum + Number(i.price) * Number(i.quantity),
        0
      ),
    [selectedCartItems]
  );

  const toggleAll = () => {
    setSelectedIds((prev) =>
      prev.length === allIds.length ? [] : [...allIds]
    );
  };

  const toggleOne = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleGoCheckout = () => {
    if (selectedIds.length === 0) return;

const checkoutState = {
  items: selectedCheckoutItems,
  subtotal: selectedCheckoutItems.reduce(
    (sum, i) => sum + Number(i.price) * Number(i.quantity),
    0
  ),
  fromCart: true,
};

navigate('/checkout', { state: checkoutState });

  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <EveryMartHeader />

      <main className="mx-auto w-full max-w-[1500px] px-4 lg:px-6 py-6 flex-1">
        <Title level={3} style={{ marginBottom: 16 }}>
          GIỎ HÀNG
        </Title>
        <Button
          style={{ marginBottom: 16 }}
          icon={<ArrowLeftOutlined />}
          onClick={() => window.history.back()}
        >
          Trở về
        </Button>

        {cart.length === 0 ? (
          <div>
            <CartHeader
              selectedIds={selectedIds}
              onToggleAll={toggleAll}
              onToggleOne={toggleOne}
              allChecked={allChecked}
              indeterminate={indeterminate}
              showMessage={showMessage}
            />
            <Suspense fallback={<Spin />}>
              <CartRecommendation />
            </Suspense>
          </div>
        ) : (
          <Row gutter={16} align="top" wrap={false}>
            <Col flex="1">
              <CartHeader
                selectedIds={selectedIds}
                onToggleAll={toggleAll}
                onToggleOne={toggleOne}
                allChecked={allChecked}
                indeterminate={indeterminate}
                showMessage={showMessage}
              />
              <Suspense fallback={<Spin />}>
                <CartRecommendation />
              </Suspense>
            </Col>

            <Col flex="300px">
              <CartSidebar
                mode="cart"
                selectedCount={selectedIds.length}
                selectedTotal={selectedTotal}
                submitLabel={`Mua Hàng (${selectedIds.length})`}
                items={selectedCheckoutItems} // ✅ items đã có variant + inventory
                onSubmit={handleGoCheckout} // khi bấm button -> checkout
              />
            </Col>
          </Row>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default CartPage;
