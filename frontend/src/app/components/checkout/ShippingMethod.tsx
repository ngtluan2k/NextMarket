import React, { useState, useMemo, useEffect } from 'react';
import { Card, Radio, Tag, Typography, Image, Button } from 'antd';
import { CheckoutItem } from '../../types/checkout';
import { Voucher } from '../../types/voucher';
import VoucherDiscountSection from './VoucherDiscountSection';
import { api } from '../../api/api';

const { Text } = Typography;

export type ShippingMethodType = 'economy' | 'fast';

export type Props = {
  items: CheckoutItem[];
  selected: ShippingMethodType;
  onChange: (m: ShippingMethodType) => void;
  etaLabel?: string;
  storeName?: string;
  saving?: number | null;
  shippingFee?: number | string | null;
  shippingFeeOld?: number | string | null;
  methodLabel?: string;
  badgeLabel?: string;
  selectedVouchers?: Voucher[];
  onApplyVoucher?: (vouchers: Voucher[], totalDiscount: number) => void;
  discountTotal?: number;
  orderAmount?: number;
  // Thêm props mới cho tính phí ship
  calculateShippingFee?: (method: ShippingMethodType) => Promise<number>;
  onShippingFeeCalculated?: (fee: number) => void;
};

const toNum = (v: number | string | null | undefined): number | null => {
  if (v === null || v === undefined) return null;
  const n = typeof v === 'string' ? Number(v.replace(/[^\d.-]/g, '')) : Number(v);
  return Number.isFinite(n) ? n : null;
};

const fmt = (v?: number | string | null): string => {
  const n = toNum(v);
  return n === null ? '' : `${n.toLocaleString('vi-VN')}đ`;
};

export const ShippingMethod: React.FC<Props> = ({
  items,
  selected,
  onChange,
  etaLabel,
  storeName,
  saving,
  shippingFee,
  shippingFeeOld,
  methodLabel = 'Giao hàng nhanh',
  badgeLabel = 'GHN EXPRESS',
  selectedVouchers = [],
  onApplyVoucher,
  orderAmount = 0,
  calculateShippingFee,
  onShippingFeeCalculated,
}) => {
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [storeDiscount, setStoreDiscount] = useState(0);
  const [currentShippingFee, setCurrentShippingFee] = useState<number | null>(
    toNum(shippingFee)
  );
  const [calculating, setCalculating] = useState(false);
  const BE_BASE_URL = import.meta.env.VITE_BE_BASE_URL;

  const storeId = items[0]?.product?.store?.id ?? 0;

  const storeVouchers = useMemo(() => {
    return selectedVouchers.filter(
      (v) =>
        v.store_id === storeId ||
        (v.applicable_store_ids && v.applicable_store_ids.includes(storeId))
    );
  }, [selectedVouchers, storeId]);

  const storeVoucher = storeVouchers[0];

  const orderItems = items.map((item) => ({
    productId: Number(item.product?.id ?? 0),
    quantity: item.quantity,
    price: Number(item.price),
  }));

  // Tính discount của store voucher
  useEffect(() => {
    const calculateStoreDiscount = async () => {
      if (storeVouchers.length === 0 || !orderAmount || !storeId) {
        setStoreDiscount(0);
        return;
      }

      try {
        const payload = {
          voucherCodes: storeVouchers.map((v) => v.code),
          orderItems: orderItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
          storeId,
          orderAmount,
        };
        const res = await api.post('/vouchers/calculate-discount', payload);
        const { discountTotal } = res.data;
        setStoreDiscount(discountTotal || 0);
      } catch (error) {
        setStoreDiscount(0);
      }
    };

    calculateStoreDiscount();
  }, [storeVouchers.map(v => v.id).join(','), orderAmount, storeId]);

  // Tính phí ship khi thay đổi phương thức
  useEffect(() => {
    const fetchShippingFee = async () => {
      if (calculateShippingFee) {
        setCalculating(true);
        try {
          const fee = await calculateShippingFee(selected);
          setCurrentShippingFee(fee);
          onShippingFeeCalculated?.(fee);
        } catch (error) {
          console.error('Lỗi tính phí ship:', error);
          // Fallback
          const fallbackFee = selected === 'economy' ? 0 : 30000;
          setCurrentShippingFee(fallbackFee);
          onShippingFeeCalculated?.(fallbackFee);
        } finally {
          setCalculating(false);
        }
      }
    };

    fetchShippingFee();
  }, [selected, calculateShippingFee]);

  const handleApply = async (newStoreVouchers: Voucher[], totalDiscount: number) => {
    const platformVouchers = selectedVouchers.filter((v) => {
      const isStoreMismatch = v.store_id !== storeId;
      const notInApplicableStores = !v.applicable_store_ids || !v.applicable_store_ids.includes(storeId);
      return isStoreMismatch && notInApplicableStores;
    });

    const allVouchers = [...newStoreVouchers, ...platformVouchers];
    onApplyVoucher?.(allVouchers, 0);
    setShowVoucherModal(false);
  };

  const handleRemoveVoucher = () => {
    const platformVouchers = selectedVouchers.filter(
      (v) =>
        v.store_id !== storeId &&
        (!v.applicable_store_ids || !v.applicable_store_ids.includes(storeId))
    );
    onApplyVoucher?.(platformVouchers, 0);
  };

  const handleMethodChange = (method: ShippingMethodType) => {
    onChange(method);
  };

  return (
    <>
      <Card title="Chọn hình thức giao hàng" bodyStyle={{ paddingTop: 12 }}>
        <Radio.Group
          value={selected}
          onChange={(e) => handleMethodChange(e.target.value as ShippingMethodType)}
          style={{ width: '100%' }}
        >
          <Card
            size="small"
            style={{
              marginBottom: 12,
              border: selected === 'economy' ? '1px solid #1677ff' : '1px solid #f0f0f0',
              background: selected === 'economy' ? 'rgba(22,119,255,0.06)' : 'transparent',
            }}
            bodyStyle={{ padding: 12 }}
          >
            <div className="flex items-center gap-8">
              <Radio value="economy">{methodLabel}</Radio>
              {currentShippingFee === 0 && (
                <Tag color="green">MIỄN PHÍ</Tag>
              )}
              {calculating && <Text type="secondary">Đang tính...</Text>}
            </div>
          </Card>
        </Radio.Group>

        <Card size="small" type="inner" style={{ marginTop: 8 }} bodyStyle={{ padding: 12 }}>
          {etaLabel && (
            <div className="flex items-center gap-2 mb-10" style={{ fontWeight: 500 }}>
              📦 <span style={{ color: '#1677ff' }}>{etaLabel}</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 12 }}>
            <div>
              {badgeLabel && (
                <Text type="secondary" style={{ fontWeight: 500 }}>
                  {badgeLabel}
                </Text>
              )}

              {items.map((it, index) => {
                const p = toNum(it.price);
                const op = toNum(it.oldPrice);

                return (
                  <div
                    key={index}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '56px 1fr auto',
                      gap: 12,
                      marginTop: 12,
                      alignItems: 'center',
                    }}
                  >
                    <Image
                      src={
                        it.image?.startsWith('http')
                          ? it.image
                          : `${BE_BASE_URL}${it.image}`
                      }
                      alt={it.name}
                      width={56}
                      height={56}
                      style={{ borderRadius: 8, objectFit: 'cover' }}
                      preview={false}
                      fallback="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='56' height='56'/>"
                    />

                    <div style={{ lineHeight: 1.4 }}>
                      <Text ellipsis style={{ maxWidth: 320 }}>
                        {it.name}
                      </Text>
                      <div>
                        <Text type="secondary">SL: x{it.quantity}</Text>
                      </div>
                    </div>

                    <div style={{ minWidth: 110, textAlign: 'right' }}>
                      {op !== null && p !== null && op > p && (
                        <Text delete type="secondary" style={{ display: 'block', fontSize: 12 }}>
                          {fmt(op)}
                        </Text>
                      )}
                      <Text strong style={{ color: '#cf1322', fontSize: 16 }}>
                        {fmt(p)}
                      </Text>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col gap-2">
              {currentShippingFee !== null && (
                <div className="flex items-center gap-10">
                  {toNum(shippingFeeOld) !== null && toNum(shippingFeeOld)! > 0 && (
                    <Text delete type="secondary">
                      {fmt(shippingFeeOld)}
                    </Text>
                  )}

                  {currentShippingFee === 0 ? (
                    <Tag color="green">MIỄN PHÍ</Tag>
                  ) : (
                    <Text strong>{fmt(currentShippingFee)}</Text>
                  )}
                </div>
              )}

              {storeName && (
                <div
                  style={{
                    background: '#f5f5f5',
                    border: '1px solid #eee',
                    borderRadius: 8,
                    padding: '8px 12px',
                  }}
                >
                  <div className="flex items-center gap-10">
                    🚚
                    <div>
                      <Text>Được giao bởi</Text>
                      <div style={{ fontWeight: 600 }}>{storeName}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {storeVoucher ? (
            <div
              style={{
                marginTop: 12,
                padding: '10px 12px',
                background: '#fff7e6',
                border: '1px solid #ffd591',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Tag color="orange" style={{ margin: 0 }}>
                  🎟️ MÃ GIẢM GIÁ
                </Tag>
                <Text strong style={{ color: '#d48806' }}>
                  -{fmt(storeDiscount)}
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  ({storeVoucher.code})
                </Text>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button
                  type="link"
                  size="small"
                  danger
                  onClick={handleRemoveVoucher}
                  style={{ padding: 0, height: 'auto' }}
                >
                  Bỏ chọn
                </Button>
              </div>
            </div>
          ) : (
            <div
              className="flex items-center gap-2 mt-12"
              style={{
                color: '#1677ff',
                cursor: 'pointer',
                padding: '8px 0',
                borderTop: '1px dashed #e8e8e8',
                paddingTop: 12,
              }}
              onClick={() => setShowVoucherModal(true)}
            >
              🧾 Thêm mã khuyến mãi của Shop
              <div style={{ marginLeft: 'auto', color: '#999' }}>›</div>
            </div>
          )}
        </Card>
      </Card>

      <VoucherDiscountSection
        visible={showVoucherModal}
        onClose={() => setShowVoucherModal(false)}
        orderItems={orderItems}
        storeId={storeId}
        orderAmount={orderAmount}
        onApply={handleApply}
        selectedVouchers={storeVouchers}
        filterByStore={true}
        maxSelect={1}
      />
    </>
  );
};