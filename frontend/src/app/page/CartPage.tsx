// src/pages/CartPage.tsx
import React, { useMemo, useState } from "react";
import EveryMartHeader from "../components/Navbar";
import Footer from "../components/Footer";
import { useNavigate } from "react-router-dom";   


import { CartHeader } from "../components/cart/CartHeader";
import { CartRecommendation } from "../components/cart/CartRecommendation";
import { CartSidebar } from "../components/cart/CartSidebar";

import { Row, Col ,Typography} from "antd";
import { useCart } from "../context/CartContext";

const { Title} = Typography;


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
  const allIds = useMemo(() => cart.map((i) => i.product_id), [cart]);

  const allChecked = selectedIds.length === allIds.length && allIds.length > 0;
  const indeterminate =
    selectedIds.length > 0 && selectedIds.length < allIds.length;


    const handleGoCheckout = () => {
      if (selectedIds.length === 0) return;
    
      const items = cart
        .filter(i => selectedIds.includes(i.product_id))
        .map(i => ({
          id: i.id,
          product_id: i.product_id,
          price: i.price,
          quantity: i.quantity,
          product: {
            name: i.product.name,
            media: i.product.media,
            url: (Array.isArray(i.product.media) ? i.product.media[0]?.url : i.product.media?.url) || i.product.url,
          },
        }));
    
      navigate("/checkout", { state: { items, subtotal: selectedTotal } });
    };
  const toggleAll = () => {
    setSelectedIds((prev) => (prev.length === allIds.length ? [] : allIds));
  };

  const toggleOne = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectedTotal = useMemo(
    () =>
      cart
        .filter((i) => selectedIds.includes(i.product_id))
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
        {cart.length === 0 ? (
          // 👉 Khi giỏ hàng trống: chỉ hiện header + recommendation
          <div>
            <CartHeader
              selectedIds={selectedIds}
              onToggleAll={toggleAll}
              onToggleOne={toggleOne}
              allChecked={allChecked}
              indeterminate={indeterminate}
              showMessage={showMessage}
            />
            <CartRecommendation />
          </div>
        ) : (
          // 👉 Khi có sản phẩm: hiện cả 2 bên
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
              <CartRecommendation />
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
