import React from 'react';
import { Checkbox, Image, Button, Typography } from 'antd';
import { DeleteOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { useCart } from '../../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

const { Text, Title } = Typography;

type Props = {
  selectedIds: number[];
  onToggleAll: () => void;
  onToggleOne: (id: number) => void;
  allChecked: boolean;
  indeterminate: boolean;
  onContinue?: () => void;
  showMessage?: (
    type: 'success' | 'error' | 'warning',
    content: string
  ) => void;
};

export const CartHeader: React.FC<Props> = ({
  selectedIds,
  onToggleAll,
  onToggleOne,
  allChecked,
  indeterminate,
  onContinue,
  showMessage,
}) => {
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const { cart, updateQuantity, removeFromCart } = useCart();

  // console.log("selected id : " + selectedIds)
  const GRID = '40px 1fr 200px 160px 200px 80px';
  const navigate = useNavigate();
  const storeName = cart[0]?.product?.store?.name ?? 'Shop';

  const selectedCartItems = cart.filter((item) =>
    selectedIds.includes(item.id)
  );
  const cartByStore = cart.reduce((acc: Record<string, typeof cart>, item) => {
    const storeId = item.product?.store?.id ?? 'unknown';
    if (!acc[storeId]) acc[storeId] = [];
    acc[storeId].push(item);
    return acc;
  }, {});
  const handleRemoveFromCart = async (
    productId: number,
    productName: string,
    variantId?: number,
    type?: 'bulk' | 'subscription' | 'normal' | 'flash_sale'
  ) => {
    try {
      console.log(productId);
      await removeFromCart(productId, variantId, type);
      showMessage?.('success', `Removed ${productName} from cart successfully`);
    } catch (error) {
      showMessage?.('error', `Failed to remove ${productName} from cart`);
    }
  };
  useEffect(() => {
    const firstSelected = cart.find((i) => selectedIds.includes(i.id));
    setSelectedType(firstSelected?.type ?? null);
  }, [selectedIds, cart]);

  const toImageUrl = (url?: string) => {
    if (!url) return '/default-product.png'; // fallback ảnh mặc định
    if (url.startsWith('http')) return url; // đã là full URL
    return `http://localhost:3000${url}`; // nếu là path local -> thêm host
  };
  // 1) GIỎ TRỐNG -> render header trống + nút "Tiếp tục mua sắm"
  if (cart.length === 0) {
    return (
      <div className="bg-white rounded-md p-6 w-full text-center">
        <ShoppingCartOutlined style={{ fontSize: 72, color: '#1677ff' }} />
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
            onClick={onContinue ?? (() => navigate('/'))}
          >
            Tiếp tục mua sắm
          </Button>
        </div>
      </div>
    );
  }

  // 2) CÓ SẢN PHẨM -> render nhóm theo từng store
  return (
    <div className="bg-white rounded-md p-4 w-full">
      {/* Header tổng */}
      <div
        className="items-center text-gray-600 text-sm font-medium border-b pb-3 w-full"
        style={{ display: 'grid', gridTemplateColumns: GRID }}
      >
        <Checkbox
          checked={allChecked}
          indeterminate={indeterminate}
          onChange={() => {
            // Nếu đã có selectedType, chỉ chọn các item cùng type
            if (selectedType) {
              cart.forEach((item) => {
                if (item.type === selectedType) onToggleOne(item.id);
              });
            } else {
              // Nếu chưa chọn gì, chọn theo type đầu tiên gặp trong cart
              const firstType = cart[0]?.type;
              cart.forEach((item) => {
                if (item.type === firstType) onToggleOne(item.id);
              });
            }
          }}
        />
        <Text>Tất cả ({cart.length} sản phẩm)</Text>
        <Text className="text-right">Đơn giá</Text>
        <Text className="text-center">Số lượng</Text>
        <Text className="text-right">Thành tiền</Text>
        <div className="text-center">
          <DeleteOutlined />
        </div>
      </div>

      {/* Nhóm các sản phẩm theo store */}
      {Object.entries(
        cart.reduce((acc: Record<string, typeof cart>, item) => {
          const storeId = item.product?.store?.id ?? 'unknown';
          if (!acc[storeId]) acc[storeId] = [];
          acc[storeId].push(item);
          return acc;
        }, {})
      ).map(([storeId, items]) => {
        const storeName = items[0].product?.store?.name ?? 'Shop';
        const allStoreChecked = items.every((item) =>
          selectedIds.includes(item.id)
        );
        const storeIndeterminate =
          !allStoreChecked &&
          items.some((item) => selectedIds.includes(item.id));

        return (
          <div key={storeId} className="mt-3">
            {/* Header từng shop */}
            <div className="flex items-center gap-2 py-3 border-b bg-gray-50 px-2 rounded-md">
              <Checkbox
                checked={allStoreChecked}
                indeterminate={storeIndeterminate}
                onChange={() => {
                  // Nếu chưa có selectedType thì lấy type của item đầu tiên trong shop
                  const currentType =
                    selectedType || (items.length > 0 ? items[0].type : null);

                  // Lọc theo type đang được chọn
                  const filtered = items.filter(
                    (item) => item.type === currentType
                  );

                  // Kiểm tra xem tất cả filtered item đã được chọn chưa
                  const allFilteredChecked = filtered.every((item) =>
                    selectedIds.includes(item.id)
                  );

                  // Toggle theo trạng thái
                  filtered.forEach((item) => {
                    const isChecked = selectedIds.includes(item.id);

                    if (allFilteredChecked && isChecked) {
                      // Nếu tất cả đã chọn → bỏ chọn hết
                      onToggleOne(item.id);
                    } else if (!allFilteredChecked && !isChecked) {
                      // Nếu chưa chọn hết → chọn tất cả
                      onToggleOne(item.id);
                    }
                  });
                }}
              />

              <Text strong>{storeName}</Text>
            </div>

            {/* Danh sách sản phẩm trong shop */}
            {items.map((item) => {
              // ✅ Nếu đang chọn subscription → disable các type khác
              const isDisabled =
                selectedType === 'subscription' && item.type !== 'subscription';

              // ✅ Nếu đang chọn type khác → chỉ disable checkbox của subscription
              const disableSubscription =
                selectedType !== null &&
                selectedType !== 'subscription' &&
                item.type === 'subscription';

              const checked = selectedIds.includes(item.id);
              const mediaArray = Array.isArray(item.product?.media)
                ? item.product.media
                : item.product?.media
                ? [item.product.media]
                : [];
              const imageUrl = toImageUrl(
                mediaArray.find((m: any) => m?.is_primary)?.url ||
                  mediaArray[0]?.url ||
                  item.product?.url
              );

              const oldPrice: number | undefined = (item as any)?.old_price;
              const deliveryDate: string | undefined = (item as any)
                ?.delivery_date;
              const color: string | undefined = (item as any)?.product?.color;

              const checkboxDisabled = isDisabled || disableSubscription;

              return (
                <div
                  key={item.id}
                  className={`items-center border-b py-4 w-full ${
                    item.is_group ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                  style={{ display: 'grid', gridTemplateColumns: GRID }}
                >
                  {/* ✅ Chỉ disable checkbox, không ẩn sản phẩm */}
                  <Checkbox
                    checked={checked}
                    disabled={checkboxDisabled}
                    onChange={() => onToggleOne(item.id)}
                  />

                  {/* Thông tin sản phẩm */}
                  <div
                    className={`flex gap-3 items-start ${
                      checkboxDisabled ? 'opacity-60' : ''
                    }`}
                  >
                    <Image
                      src={imageUrl}
                      alt={item.product?.name}
                      width={80}
                      height={80}
                      className="rounded-md object-cover"
                      preview={false}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <Text className="block font-medium">
                          {item.product?.name}
                        </Text>
                        {item.is_group && (
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                            🛒 Mua chung
                          </span>
                        )}
                      </div>

                      {item.variant && (
                        <Text type="secondary" className="block text-xs">
                          Variant: {item.variant.variant_name}
                        </Text>
                      )}
                      <Text type="secondary" className="block text-xs">
                        Type: {item.type}
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
                    {typeof oldPrice === 'number' && (
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
                          updateQuantity(
                            item.product.id,
                            Math.max(1, item.quantity - 1),
                            item.variant?.id,
                            item.type
                          )
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
                          updateQuantity(
                            item.product.id,
                            item.quantity + 1,
                            item.variant?.id,
                            item.type
                          )
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

                  {/* Xóa */}
                  <div className="text-center">
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() =>
                        handleRemoveFromCart(
                          item.product.id,
                          item.product.name,
                          item.variant?.id,
                          item.type
                        )
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};
