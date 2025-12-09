import React, { useState, useEffect } from 'react';
import { Card, Typography, Button, Tag, message, Modal, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { api } from '../../api/api';
import { CheckoutItem } from '../../types/checkout';
import { useAuth } from '../../context/AuthContext';
import { PaymentMethodResponse } from '../../types/payment';
import { UserAddress } from '../../types/user';
import { CartItem } from '../../types/cart';
import { Voucher } from '../../types/voucher';
import VoucherDiscountSection from '../checkout/VoucherDiscountSection';
import AddressModal from '../../page/AddressModal';
import { fetchMyWallet } from '../../../service/wallet.service';
import { orderService } from '../../../service/order.service';
import { Wallet } from '../../types/wallet';
const { Text } = Typography;

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
  onSubmit?: () => void;
  onAddressChange?: (address: UserAddress) => void;
  selectedVouchers?: Voucher[];
  discountTotal?: number;
  onApplyVoucher?: (vouchers: Voucher[], totalDiscount: number) => void;
  onRemoveVoucher?: (voucherId: number) => void;
  // Thêm props mới cho tính phí ship
  shippingFee?: number;
  onShippingFeeChange?: (fee: number) => void;
  calculateShippingFee?: () => Promise<number>;
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
  onSubmit,
  onAddressChange,
  selectedVouchers = [],
  discountTotal = 0,
  onApplyVoucher,
  onRemoveVoucher,
  shippingFee: propShippingFee = 0,
  onShippingFeeChange,
  calculateShippingFee,
}) => {
  const { } = useCart() as { cart: CartItem[] };
  const navigate = useNavigate();
  const { me } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isAddressModalVisible, setIsAddressModalVisible] = useState(false);
  const [isVoucherModalVisible, setIsVoucherModalVisible] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<UserAddress | null>(
    userAddress || null
  );
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [shippingFee, setShippingFee] = useState<number>(propShippingFee);
  const [calculatingShipping, setCalculatingShipping] = useState(false);

  useEffect(() => {
    const getWallet = async () => {
      setWalletLoading(true);
      try {
        const data = await fetchMyWallet();
        setWallet(data);
      } catch (err) {
        // Không cần thông báo lỗi
      } finally {
        setWalletLoading(false);
      }
    };

    getWallet();
  }, []);

  useEffect(() => {
    if (userAddress) {
      setSelectedAddress(userAddress);
    }
  }, [userAddress]);

  useEffect(() => {
    setShippingFee(propShippingFee);
  }, [propShippingFee]);

  // Tính phí ship khi thay đổi địa chỉ
  useEffect(() => {
    if (mode === 'checkout' && selectedAddress && items.length > 0) {
      calculateShipping();
    }
  }, [selectedAddress, items]);

  const calculateShipping = async () => {
    if (!selectedAddress || items.length === 0) {
      console.log('⚠️ Không thể tính phí ship: thiếu địa chỉ hoặc items');
      return;
    }

    setCalculatingShipping(true);

    console.log('═══════════════════════════════════');
    console.log('🚀 BẮT ĐẦU TÍNH PHÍ SHIP');
    console.log('═══════════════════════════════════');

    try {
      let fee = 0;

      // Nếu có prop calculateShippingFee từ parent, dùng nó
      if (calculateShippingFee) {
        console.log('ℹ️ Sử dụng hàm calculateShippingFee từ props');
        fee = await calculateShippingFee();
        setShippingFee(fee);
        onShippingFeeChange?.(fee);
        return;
      }

      // Ngược lại, tính phí ship trong component này
      const storeId = items[0]?.product?.store?.id;
      if (!storeId) {
        throw new Error('Không tìm thấy cửa hàng');
      }

      console.log('🏪 Store ID:', storeId);
      console.log('📍 Address ID:', selectedAddress.id);
      console.log('📦 Số lượng items:', items.length);

      // ✅ TÍNH TOTAL WEIGHT CHI TIẾT
      let totalWeight = 0;

      items.forEach((item, index) => {
        const variantWeight = item.variant?.weight;
        const productWeight = item.product?.weight;
        const fallbackWeight = 5000; // 5kg mặc định

        // Ưu tiên: variant.weight > product.weight > 5000g
        const itemWeight = variantWeight || productWeight || fallbackWeight;
        const itemTotal = itemWeight * item.quantity;
        totalWeight += itemTotal;

        console.log(`📦 Item ${index + 1}: ${item.product?.name || 'Unknown'}`);
        console.log(`   - Variant: ${item.variant?.variant_name || 'N/A'}`);
        console.log(`   - Variant Weight: ${variantWeight}g`);
        console.log(`   - Product Weight: ${productWeight}g`);
        console.log(`   - Weight Used: ${itemWeight}g`);
        console.log(`   - Quantity: ${item.quantity}`);
        console.log(`   - Subtotal Weight: ${itemTotal}g`);
      });

      console.log('⚖️ TỔNG WEIGHT TÍNH RA:', totalWeight, 'grams');
      console.log('⚖️ TỔNG WEIGHT (kg):', (totalWeight / 1000).toFixed(2), 'kg');

      // Tạo payload
      const payload = {
        storeId,
        addressId: selectedAddress.id,
        totalWeight, // Giá trị đã tính
        items: items.map(item => ({
          productId: item.product?.id,
          variantId: item.variant?.id,
          quantity: item.quantity,
          weight: item.variant?.weight || item.product?.weight || 5000
        }))
      };

      console.log('📤 PAYLOAD CHUẨN BỊ GỬI:');
      console.log(JSON.stringify(payload, null, 2));
      console.log('🔢 typeof payload.totalWeight:', typeof payload.totalWeight);
      console.log('🔢 payload.totalWeight value:', payload.totalWeight);
      console.log('🔢 Is NaN?:', Number.isNaN(payload.totalWeight));
      console.log('🔢 Is Finite?:', Number.isFinite(payload.totalWeight));

      // Gọi API
      console.log('🌐 Đang gọi API...');
      const response = await api.post('/orders/calculate-shipping-fee', payload);

      console.log('📥 RESPONSE NHẬN ĐƯỢC:');
      console.log(JSON.stringify(response.data, null, 2));

      fee = response.data.data?.shippingFee || 0;

      console.log('💰 Phí ship cuối cùng:', fee, 'đ');
      console.log('═══════════════════════════════════');

      setShippingFee(fee);
      onShippingFeeChange?.(fee);

    } catch (error: any) {
      console.error('═══════════════════════════════════');
      console.error('❌ LỖI TÍNH PHÍ SHIP:');
      console.error('Error message:', error.message);
      console.error('Error response:', error.response?.data);
      console.error('Error config:', error.config?.data);
      console.error('═══════════════════════════════════');

      message.warning('Không thể tính phí ship. Đang dùng phí mặc định 30.000đ');
      setShippingFee(30000);
      onShippingFeeChange?.(30000);
    } finally {
      setCalculatingShipping(false);
    }
  };
  const finalTotal = selectedTotal - discountTotal + shippingFee;

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (items.length === 0) {
        message.error('Không có sản phẩm trong đơn hàng');
        return;
      }

      if (!selectedAddress || !selectedAddress.id) {
        message.error('Vui lòng chọn địa chỉ giao hàng');
        return;
      }

      const userId = me?.user_id;
      if (!userId) {
        message.error('Vui lòng đăng nhập để đặt hàng');
        navigate('/login');
        return;
      }

      if (paymentMethods.length === 0 || !selectedPaymentMethod) {
        message.error('Vui lòng chọn phương thức thanh toán');
        return;
      }

      const storeId = items[0]?.product?.store?.id;

      // Sử dụng phí ship đã tính toán
      const shippingFeeToUse = shippingFee;

      const orderPayload = {
        userId,
        storeId,
        addressId: selectedAddress.id,
        subtotal: Number(selectedTotal),
        shippingFee: shippingFeeToUse, // Sử dụng phí ship đã tính
        voucherCodes: selectedVouchers.map((v) => v.code),
        items: items.map((item) => ({
          productId: Number(item.product?.id),
          variantId: item.variant?.id ? Number(item.variant.id) : undefined,
          quantity: Number(item.quantity),
          price: Number(item.price),
          type: item.type || 'bulk',
          pricingRuleId: item.pricing_rule?.id ?? undefined,
          weight: item.variant?.weight ?? 800
        })),
      };

      console.log('📦 Order payload:', JSON.stringify(orderPayload, null, 2));

      const order = await orderService.createOrder(userId, orderPayload);
      console.log('Đơn hàng đã được tạo:', order);

      if (!order || !order.id) {
        console.error('❌ Order creation failed');
        message.error('Không thể tạo đơn hàng. Vui lòng thử lại.');
        return;
      }

      console.log('✅ Order created:', {
        id: order.id,
        subtotal: order.subtotal,
        shippingFee: order.shippingFee,
        discountTotal: order.discountTotal,
        totalAmount: order.totalAmount,
      });

      const selectedMethod = paymentMethods.find(
        (m) => m.type === selectedPaymentMethod
      );

      if (!selectedMethod) {
        message.error(
          `Không tìm thấy phương thức thanh toán: ${selectedPaymentMethod}`
        );
        return;
      }

      const orderUuid = order.uuid || String(order.id);
      const paymentPayload = {
        orderUuid,
        paymentMethodUuid: selectedMethod.uuid,
        amount: Number(order.totalAmount),
      };

      console.log('💳 Tạo thanh toán:', paymentPayload);
      const paymentRes = await api.post('/payments', paymentPayload);
      const { redirectUrl, payment } = paymentRes.data;

      const successState = {
        orderCode: order.uuid || order.id,
        total: order.totalAmount,
        discountTotal: order.discountTotal,
        subtotal: order.subtotal,
        shippingFee: order.shippingFee,
        paymentMethodLabel: selectedMethod.name,
        etaLabel,
        items,
        selectedVouchers,
        status:
          selectedMethod.type === 'cod' || selectedMethod.type === 'everycoin'
            ? 'success'
            : payment?.status ?? 'pending',
      };

      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        navigate('/order-success', {
          state: successState,
          replace: true,
        });
      }
    } catch (err: any) {
      console.error('❌ Order Error:', err.response?.data || err.message);
      message.error(err.message || 'Không thể tạo đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyVoucherProp = (vouchers: Voucher[], totalDiscount: number) => {
    onApplyVoucher?.(vouchers, totalDiscount);
  };

  const handleRemoveVoucherProp = (voucherId: number) => {
    onRemoveVoucher?.(voucherId);
  };

  const showConfirmModal = () => {
    setIsModalVisible(true);
  };

  const handleModalConfirm = () => {
    setIsModalVisible(false);
    handleSubmit();
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
  };

  const handleAddressSelect = async (address: UserAddress) => {
    setSelectedAddress(address);
    onAddressChange?.(address);

    // Tính lại phí ship khi thay đổi địa chỉ
    if (mode === 'checkout') {
      await calculateShipping();
    }
  };

  return (
    <div
      style={{ position: 'sticky', top: 24, maxWidth: 360, marginLeft: 'auto' }}
    >
      <Card style={{ marginBottom: 16 }}>
        <div className="flex justify-between items-center mb-2">
          <Text strong>Giao tới</Text>
          <Button
            type="link"
            size="small"
            onClick={() => setIsAddressModalVisible(true)}
          >
            Thay đổi
          </Button>
        </div>
        <p>
          {selectedAddress ? (
            <>
              <strong>{selectedAddress.recipientName}</strong> |{' '}
              {selectedAddress.phone}
              <br />
              {[
                selectedAddress.street,
                selectedAddress.ward,
                selectedAddress.district,
                selectedAddress.province,
                selectedAddress.country,
              ]
                .filter(Boolean)
                .join(', ')}
            </>
          ) : (
            <Text type="secondary">Vui lòng chọn địa chỉ giao hàng</Text>
          )}
        </p>
      </Card>

      <AddressModal
        visible={isAddressModalVisible}
        onClose={() => setIsAddressModalVisible(false)}
        currentAddressId={selectedAddress?.id}
        onSelect={handleAddressSelect}
      />

      <Card style={{ marginBottom: 16 }}>
        <Text strong>Số dư ví</Text>
        <p>
          {walletLoading
            ? 'Đang tải...'
            : wallet
              ? `${wallet.balance.toLocaleString()} ${wallet.currency}`
              : 'Chưa có thông tin ví'}
        </p>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <div className="flex justify-between items-center mb-2">
          <Text strong>Khuyến Mãi</Text>
          <Button
            type="link"
            size="small"
            onClick={() => setIsVoucherModalVisible(true)}
          >
            Chọn voucher
          </Button>
        </div>
        <div className="flex flex-col gap-2">
          {selectedVouchers.length > 0 ? (
            selectedVouchers.map((voucher) => (
              <div
                key={voucher.id}
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
                  {voucher.discount_type === 0
                    ? `Giảm ${voucher.discount_value
                    }% tối đa ${voucher.max_discount_amount?.toLocaleString()}đ`
                    : `Giảm ${voucher.discount_value.toLocaleString()}đ`}
                </Text>
                <Button
                  size="small"
                  type="primary"
                  onClick={() => handleRemoveVoucherProp(voucher.id)}
                >
                  Bỏ chọn
                </Button>
              </div>
            ))
          ) : (
            <Text type="secondary">Chưa chọn voucher</Text>
          )}
        </div>
      </Card>

      <VoucherDiscountSection
        visible={isVoucherModalVisible}
        onClose={() => setIsVoucherModalVisible(false)}
        orderItems={items.map((item) => ({
          productId: Number(item.product?.id),
          quantity: Number(item.quantity),
          price: Number(item.price),
        }))}
        storeId={items[0]?.product?.store?.id || 1}
        orderAmount={selectedTotal}
        onApply={handleApplyVoucherProp}
        selectedVouchers={selectedVouchers}
        filterByStore={false}
      />

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Text>Tổng tiền hàng ({selectedCount})</Text>
          <Text>{selectedTotal.toLocaleString()}đ</Text>
        </div>

        {/* Phí vận chuyển */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          <Text>
            Phí vận chuyển
            {calculatingShipping && (
              <Spin size="small" style={{ marginLeft: 8 }} />
            )}
          </Text>
          <Text>
            {calculatingShipping ? 'Đang tính...' : `${shippingFee.toLocaleString()}đ`}
            {shippingFee === 0 && ' (Miễn phí)'}
          </Text>
        </div>

        {discountTotal > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <Text>Giảm giá</Text>
            <Text>-{discountTotal.toLocaleString()}đ</Text>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          <Text strong>Tổng thanh toán</Text>
          <Text strong style={{ color: 'red', fontSize: 18 }}>
            {finalTotal.toLocaleString()}đ
          </Text>
        </div>

        <Button
          type="primary"
          block
          size="large"
          style={{ marginTop: 16, borderRadius: 6 }}
          disabled={selectedCount === 0 || loading || calculatingShipping}
          onClick={mode === 'checkout' ? showConfirmModal : onSubmit}
          loading={loading}
        >
          {submitLabel ??
            (mode === 'checkout' ? 'Đặt hàng' : `Mua Hàng (${selectedCount})`)}
        </Button>
      </Card>

      {/* Modal xác nhận đơn hàng */}
      <Modal
        title="Xác nhận đơn hàng"
        visible={isModalVisible}
        onOk={handleModalConfirm}
        onCancel={handleModalCancel}
        okText="Xác nhận"
        cancelText="Hủy"
        width={600}
      >
        <div>
          <Text strong>Thông tin giao hàng</Text>
          {selectedAddress ? (
            <div style={{ marginTop: 8 }}>
              <p>
                <Text strong>
                  {selectedAddress.recipientName ?? 'Người nhận'} |{' '}
                  {selectedAddress.phone ?? 'Chưa có SĐT'}
                </Text>
              </p>
              <p>
                {selectedAddress.fullAddress ??
                  [
                    selectedAddress.street,
                    selectedAddress.ward,
                    selectedAddress.district,
                    selectedAddress.province,
                  ]
                    .filter(Boolean)
                    .join(', ')}
              </p>
              {selectedAddress.tag && (
                <Tag color="green">{selectedAddress.tag}</Tag>
              )}
            </div>
          ) : (
            <Text type="secondary">Chưa chọn địa chỉ giao hàng</Text>
          )}

          <div style={{ marginTop: 16 }}>
            <Text strong>Phương thức thanh toán</Text>
            <p>
              {paymentMethods.find((m) => m.type === selectedPaymentMethod)
                ?.name ?? 'Chưa chọn phương thức thanh toán'}
            </p>
          </div>

          <div style={{ marginTop: 16 }}>
            <Text strong>Thông tin đơn hàng</Text>
            {items.map((item, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: 8,
                }}
              >
                <Text>
                  {item.product?.name}{' '}
                  {item.variant?.variant_name
                    ? `(${item.variant.variant_name})`
                    : ''}{' '}
                  x {item.quantity}
                </Text>
                <Text>{Number(item.price) * Number(item.quantity)}đ</Text>
              </div>
            ))}
          </div>

          {selectedVouchers.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <Text strong>Khuyến mãi</Text>
              {selectedVouchers.map((voucher) => (
                <div key={voucher.id} style={{ marginTop: 8 }}>
                  <Text>
                    {voucher.discount_type === 0
                      ? `Giảm ${voucher.discount_value
                      }% tối đa ${voucher.max_discount_amount?.toLocaleString()}đ`
                      : `Giảm ${voucher.discount_value.toLocaleString()}đ`}
                  </Text>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between' }}>
            <Text>Tổng tiền hàng</Text>
            <Text>{selectedTotal.toLocaleString()}đ</Text>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <Text>Phí vận chuyển</Text>
            <Text>{shippingFee.toLocaleString()}đ</Text>
          </div>

          {discountTotal > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <Text>Giảm giá</Text>
              <Text>-{discountTotal.toLocaleString()}đ</Text>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <Text strong>Tổng thanh toán</Text>
            <Text strong style={{ color: 'red', fontSize: 16 }}>
              {finalTotal.toLocaleString()}đ
            </Text>
          </div>

          {etaLabel && (
            <div style={{ marginTop: 16 }}>
              <Text strong>Thời gian giao hàng dự kiến</Text>
              <p>{etaLabel}</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default CartSidebar;