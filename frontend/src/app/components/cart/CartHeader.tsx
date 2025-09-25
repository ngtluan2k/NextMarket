// src/components/cart/CartHeader.tsx
import React from "react";
import { Checkbox, Image, Button, Typography } from "antd";
import { DeleteOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import { useCart } from "../../context/CartContext";

const { Text, Title } = Typography;

type Props = {
  selectedIds: number[];
  onToggleAll: () => void;
  onToggleOne: (id: number) => void;
  allChecked: boolean;
  indeterminate: boolean;
  onContinue?: () => void; // <- thêm: dùng cho "Tiếp tục mua sắm"
};

export const CartHeader: React.FC<Props> = ({
  selectedIds,
  onToggleAll,
  onToggleOne,
  allChecked,
  indeterminate,
  onContinue,
}) => {
  const { cart, updateQuantity, removeFromCart } = useCart();
  const GRID = "40px 1fr 200px 160px 200px 80px";

  const shopName =
    (cart[0] && (cart[0] as any).shop?.name) ||
    (cart[0] && (cart[0] as any).shop_name) ||
    "Shop";

  // 1) GIỎ TRỐNG -> render header trống + nút "Tiếp tục mua sắm"
  if (cart.length === 0) {
    return (
      <div className="bg-white rounded-md p-6 w-full text-center">
        <ShoppingCartOutlined style={{ fontSize: 72, color: "#1677ff" }} />
        <Title level={4} style={{ marginTop: 12, marginBottom: 4 }}>
          Giỏ hàng trống
        </Title>
        <Text type="secondary">
          Bạn tham khảo thêm các sản phẩm được gợi ý bên dưới nhé!
        </Text>
        <div className="mt-4">
          <Button
            type="primary"
            size="large"
            onClick={onContinue ?? (() => window.history.back())}
          >
            Tiếp tục mua sắm
          </Button>
        </div>
      </div>
    );
  }

  // 2) CÓ SẢN PHẨM -> render như bình thường
  return (
    <div className="bg-white rounded-md p-4 w-full">
      {/* Header */}
      <div
        className="items-center text-gray-600 text-sm font-medium border-b pb-3 w-full"
        style={{ display: "grid", gridTemplateColumns: GRID }}
      >
        <Checkbox
          checked={allChecked}
          indeterminate={indeterminate}
          onChange={onToggleAll}
        />
        <Text>Tất cả ({cart.length} sản phẩm)</Text>
        <Text className="text-right">Đơn giá</Text>
        <Text className="text-center">Số lượng</Text>
        <Text className="text-right">Thành tiền</Text>
        <div className="text-center">
          <DeleteOutlined />
        </div>
      </div>

      {/* Shop */}
      <div className="flex items-center gap-2 py-3 border-b">
        <Checkbox
          checked={allChecked}
          indeterminate={indeterminate}
          onChange={onToggleAll}
        />
        <Text strong>{shopName}</Text>
      </div>

      {/* Products */}
      {cart.map((item) => {
        const mediaArray = Array.isArray((item as any).product?.media)
          ? (item as any).product.media
          : (item as any).product?.media
          ? [(item as any).product.media]
          : [];
        const imageUrl =
          mediaArray.find((m: any) => m?.is_primary)?.url ||
          mediaArray[0]?.url ||
          (item as any).product?.url ||
          "";

        const oldPrice: number | undefined = (item as any)?.old_price;
        const deliveryDate: string | undefined = (item as any)?.delivery_date;
        const color: string | undefined = (item as any)?.product?.color;

        const checked = selectedIds.includes(item.product_id);

        return (
          <div
            key={item.id}
            className="items-center border-b py-4 w-full"
            style={{ display: "grid", gridTemplateColumns: GRID }}
          >
            {/* Checkbox từng sản phẩm */}
            <Checkbox
              checked={checked}
              onChange={() => onToggleOne(item.product_id)}
            />

            {/* Thông tin sản phẩm */}
            <div className="flex gap-3 items-start">
              <Image
                src={imageUrl}
                alt={(item as any).product?.name}
                width={80}
                height={80}
                className="rounded-md object-cover"
                preview={false}
              />
              <div>
                <Text className="block font-medium">
                  {(item as any).product?.name}
                </Text>
                {color && (
                  <Text type="secondary" className="block text-xs">
                    {color}
                  </Text>
                )}
                {deliveryDate && (
                  <Text type="secondary" className="block text-xs">
                    🚚 {deliveryDate}
                  </Text>
                )}
              </div>
            </div>

            {/* Đơn giá */}
            <div className="text-right">
              {typeof oldPrice === "number" && (
                <Text delete className="text-gray-400 block">
                  {oldPrice.toLocaleString()}đ
                </Text>
              )}
              <Text className="text-red-500 font-semibold">
                {item.price.toLocaleString()}đ
              </Text>
            </div>

            {/* Số lượng */}
            <div className="flex justify-center">
              <div className="flex border rounded">
                <button
                  className="px-2"
                  onClick={() =>
                    updateQuantity(item.product_id, Math.max(1, item.quantity - 1))
                  }
                >
                  -
                </button>
                <input
                  type="text"
                  value={item.quantity}
                  readOnly
                  className="w-10 text-center border-x"
                />
                <button
                  className="px-2"
                  onClick={() =>
                    updateQuantity(item.product_id, item.quantity + 1)
                  }
                >
                  +
                </button>
              </div>
            </div>

            {/* Thành tiền */}
            <Text className="text-right text-red-500 font-semibold">
              {(item.price * item.quantity).toLocaleString()}đ
            </Text>

            {/* Xoá */}
            <div className="text-center">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => removeFromCart(item.product_id)}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};