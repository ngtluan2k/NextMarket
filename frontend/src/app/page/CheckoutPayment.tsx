// src/page/CheckoutPayment.tsx
import React, { useMemo, useState } from "react";
import { Row, Col, Typography, Modal } from "antd";
import { useLocation, useNavigate } from "react-router-dom"; // <-- add useNavigate

import EveryMartHeader from "../components/Navbar";
import Footer from "../components/Footer";
import { CartSidebar } from "../components/cart/CartSidebar";

import {
  ShippingMethod,
  ShippingMethodType,
  CheckoutItem,
} from "../components/checkout/ShippingMethod";
import PaymentMethods, {
  PaymentMethodType,
  SavedCard,
} from "../components/checkout/PaymentMethods";

const { Title } = Typography;

type CheckoutLocationState = {
  items: Array<{
    id: number;
    product_id: number;
    price: number | string;
    quantity: number;
    product: { name: string; media?: any; url?: string; storeName?: string };
  }>;
  subtotal: number | string;
};

const CheckoutPayment: React.FC = () => {
  const navigate = useNavigate(); // <-- new
  const location = useLocation();
  const state = (location.state ?? { items: [], subtotal: 0 }) as CheckoutLocationState;

  const items = state.items ?? [];
  const subtotalNum =
    typeof state.subtotal === "string" ? Number(state.subtotal) : state.subtotal ?? 0;

  // Map dữ liệu cho ShippingMethod
  const checkoutItems: CheckoutItem[] = useMemo(
    () =>
      items.map((i) => ({
        id: i.id,
        name: i.product.name,
        image: Array.isArray(i.product.media)
          ? i.product.media.find((m: any) => m?.is_primary)?.url || i.product.media[0]?.url
          : i.product.media?.url || i.product.url,
        quantity: i.quantity,
        price: i.price,
      })),
    [items]
  );

  // 1) Chọn phương thức giao
  const [shippingMethod, setShippingMethod] = useState<ShippingMethodType>("economy");
  const shippingFee = shippingMethod === "economy" ? 0 : 22000;
  const shippingFeeOld = shippingMethod === "economy" ? 32700 : null;
  const saving = shippingMethod === "economy" ? 32000 : 0;
  const etaLabel = "Giao thứ 6, trước 19h, 26/09";

  // 2) Chọn phương thức thanh toán
  const [method, setMethod] = useState<PaymentMethodType>("momo");
  const [openAddCard, setOpenAddCard] = useState(false);
  const savedCards: SavedCard[] = [{ id: "1", brand: "VISA", last4: "4242", exp: "12/26" }];

  // Tổng tiền
  const total = useMemo(
    () => Math.max(0, subtotalNum + (shippingFee || 0)),
    [subtotalNum, shippingFee]
  );
  const selectedCount = useMemo(
    () => items.reduce((s, it) => s + it.quantity, 0),
    [items]
  );

  // === Điều hướng sang trang thành công ===
  const handlePlaceOrder = async () => {
    // TODO: gọi API tạo đơn thật sự; dưới đây là mock thành công
    const orderCode = String(Math.floor(100000000 + Math.random() * 900000000));

    navigate("/order/success", {
      state: {
        orderCode,
        total,
        paymentMethodLabel:
          {
            cod: "Thanh toán tiền mặt",
            viettel_money: "Viettel Money",
            momo: "Ví MoMo",
            zalopay: "Ví ZaloPay",
            vnpay_qr: "VNPAY - QR Ngân hàng",
            card: "Thẻ tín dụng/Ghi nợ",
          }[method],
        etaLabel,
        items: checkoutItems,
      },
      replace: true,
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <EveryMartHeader />

      <main className="mx-auto w-full max-w-[1280px] px-4 lg:px-6 py-6 flex-1">
        <Title level={3} style={{ marginBottom: 16 }}>
          THANH TOÁN
        </Title>

        <Row gutter={24} align="top" wrap={false}>
          {/* TRÁI: nội dung chính */}
          <Col flex="1">
            <ShippingMethod
              items={checkoutItems}
              selected={shippingMethod}
              onChange={setShippingMethod}
              etaLabel={etaLabel}
              storeName={items[0]?.product?.storeName ?? "Logitech Official Store"}
              saving={saving}
              shippingFee={shippingFee}
              shippingFeeOld={shippingFeeOld}
            />

            <div style={{ marginTop: 12 }}>
              <PaymentMethods
                selected={method}
                onChange={setMethod}
                // LƯU Ý: dùng dấu '/' khi lấy file từ public/
                icons={{
                  cod: <img src="/1.png" width={28} height={28} alt="Tiền mặt" />,
                  viettel_money: (
                    <img src="/viettel.png" width={28} height={28} alt="Viettel Money" />
                  ),
                  momo: <img src="/momo.png" width={28} height={28} alt="MoMo" />,
                  zalopay: <img src="/zalo.png" width={28} height={28} alt="ZaloPay" />,
                  vnpay_qr: <img src="/vnpay.png" width={28} height={28} alt="VNPAY" />,
                }}
                savedCards={savedCards}
                onAddCard={() => setOpenAddCard(true)}
              />
            </div>
          </Col>

          {/* PHẢI: Sidebar */}
          <Col flex="320px">
            <CartSidebar
              mode="checkout"
              selectedTotal={total}
              selectedCount={selectedCount}
              submitLabel="Đặt hàng"
              onSubmit={handlePlaceOrder}
            />
          </Col>
        </Row>
      </main>

      <Footer />

      {/* Modal thêm thẻ (demo) */}
      <Modal
        open={openAddCard}
        onCancel={() => setOpenAddCard(false)}
        onOk={() => setOpenAddCard(false)}
        title="Thêm thẻ mới"
      >
        (Form thêm thẻ sẽ đặt ở đây)
      </Modal>
    </div>
  );
};

export default CheckoutPayment;
