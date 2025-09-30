import React, { Suspense, useMemo, useState } from 'react';
import EveryMartHeader from '../components/Navbar';
import Footer from '../components/Footer';
import { useNavigate } from 'react-router-dom';

import { CartHeader } from '../components/cart/CartHeader';
import { CartRecommendation } from '../components/cart/CartRecommendation';
import { CartSidebar } from '../components/cart/CartSidebar';

import { Row, Col, Typography, Button, Spin } from 'antd';
import { useCart } from '../context/CartContext';
import { ArrowLeftOutlined } from '@ant-design/icons';

const { Title } = Typography;

interface CartProps {
  showMessage?: (
    type: 'success' | 'error' | 'warning',
    content: string
  ) => void;
}

const CartPage: React.FC<CartProps> = ({ showMessage }) => {
  const { cart } = useCart();
  console.log('Cart contents:', cart);
  const navigate = useNavigate();

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const allIds = useMemo(() => cart.map((i) => i.id), [cart]);  

  const allChecked = selectedIds.length === allIds.length && allIds.length > 0;
  const indeterminate =
    selectedIds.length > 0 && selectedIds.length < allIds.length;

  const handleGoCheckout = () => {
    if (selectedIds.length === 0) return;

    const items = cart
      .filter((i) => selectedIds.includes(i.id)) 
      .map((i) => ({
        id: i.id,
        product_id: i.productId,
        price: i.price,
        quantity: i.quantity,
        product: {
          name: i.product.name,
          media: i.product.media,
          url:
            (Array.isArray(i.product.media)
              ? i.product.media[0]?.url
              : i.product.media?.url) || i.product.url,
        },
      }));

    navigate('/checkout', { state: { items, subtotal: selectedTotal } });
  };
  const toggleAll = () => {
    setSelectedIds((prev) => (prev.length === allIds.length ? [] : [...allIds]));
  };

  const toggleOne = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectedTotal = useMemo(
    () =>
      cart
        .filter((i) => selectedIds.includes(i.id))  
        .reduce((sum, i) => sum + i.price * i.quantity, 0),
    [cart, selectedIds]
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <EveryMartHeader />

      <main className="mx-auto w-full max-w-[1500px] px-4 lg:px-6 py-6 flex-1">
        {/* Tiêu đề trang */}
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
                onSubmit={handleGoCheckout}
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