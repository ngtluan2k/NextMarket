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
  methodLabel = 'Giao tiết kiệm',
  badgeLabel = 'GIAO TIẾT KIỆM',
  selectedVouchers = [],
  onApplyVoucher,
  orderAmount = 0,
}) => {
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [storeDiscount, setStoreDiscount] = useState(0);
  const BE_BASE_URL = import.meta.env.VITE_BE_BASE_URL;

  const storeId = items[0]?.product?.store?.id ?? 0;

  //  CHỈ LẤY VOUCHER CỦA STORE NÀY
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

  //  TÍNH DISCOUNT CHỈ CỦA STORE VOUCHER
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

  const handleApply = async (newStoreVouchers: Voucher[], totalDiscount: number) => {

    // (Không phải từ modal, vì modal chỉ có store vouchers)
    const platformVouchers = selectedVouchers.filter((v) => {
      const isStoreMismatch = v.store_id !== storeId;
      const notInApplicableStores = !v.applicable_store_ids || !v.applicable_store_ids.includes(storeId);
      return isStoreMismatch && notInApplicableStores;
    });

    console.log('  - Filtered PLATFORM vouchers:', platformVouchers.map(v => ({ id: v.id, code: v.code, store_id: v.store_id })));

    const allVouchers = [...newStoreVouchers, ...platformVouchers];

    console.log('  - FINAL vouchers to send to parent:', allVouchers.map(v => ({ id: v.id, code: v.code, store_id: v.store_id })));

    onApplyVoucher?.(allVouchers, 0); // Truyền 0 vì parent sẽ tự tính
    setShowVoucherModal(false);
  };

  const handleRemoveVoucher = () => {
    console.log('❌ [ShippingMethod] Removing store voucher');
    console.log('Current selected vouchers:', selectedVouchers.map(v => ({ id: v.id, code: v.code, store_id: v.store_id })));
    
    //  CHỈ XÓA VOUCHER STORE, GIỮ LẠI VOUCHER PLATFORM
    const platformVouchers = selectedVouchers.filter(
      (v) =>
        v.store_id !== storeId &&
        (!v.applicable_store_ids || !v.applicable_store_ids.includes(storeId))
    );

    console.log('🔄 [ShippingMethod] Platform vouchers after remove:', platformVouchers.map(v => ({ id: v.id, code: v.code, store_id: v.store_id })));

    onApplyVoucher?.(platformVouchers, 0); 
  };

  return (
    <>
      <Card title="Chọn hình thức giao hàng" bodyStyle={{ paddingTop: 12 }}>
        <Radio.Group
          value={selected}
          onChange={(e) => onChange(e.target.value as ShippingMethodType)}
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
              {typeof saving === 'number' && saving > 0 && (
                <Text style={{ color: '#52c41a' }}>-{Math.round(saving / 1000)}K</Text>
              )}
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
              {(toNum(shippingFee) !== null || toNum(shippingFeeOld) !== null) && (
                <div className="flex items-center gap-10">
                  {toNum(shippingFeeOld) !== null && toNum(shippingFeeOld)! > 0 && (
                    <Text delete type="secondary">
                      {fmt(shippingFeeOld)}
                    </Text>
                  )}

                  {toNum(shippingFee) === 0 ? (
                    <Tag color="green">MIỄN PHÍ</Tag>
                  ) : (
                    toNum(shippingFee) !== null && <Text strong>{fmt(shippingFee)}</Text>
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