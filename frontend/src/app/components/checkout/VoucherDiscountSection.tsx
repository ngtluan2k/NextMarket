import React, { useState, useEffect } from 'react';
import { Modal, List, Button, Input, message, Tag, Empty, Spin } from 'antd';
import {
  TagOutlined,
  CheckCircleFilled,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { api } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Voucher,
  OrderItem,
  VoucherDiscountType,
  VoucherType,
} from '../../types/voucher';

interface Props {
  visible: boolean;
  onClose: () => void;
  orderItems: OrderItem[];
  storeId: number;
  orderAmount: number;
  onApply: (vouchers: Voucher[], totalDiscount: number) => void;
  selectedVouchers?: Voucher[];
  maxSelect?: number;
}



const VoucherDiscountSection: React.FC<Props> = ({
  visible,
  onClose,
  orderItems,
  storeId,
  orderAmount,
  onApply,
  selectedVouchers = [],
  maxSelect = Infinity,
}) => {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>(
    selectedVouchers.map((v) => v.id)
  );
  const [selectedTypes, setSelectedTypes] = useState<number[]>(
    selectedVouchers.map((v) => v.type)
  );
  const [voucherDiscounts, setVoucherDiscounts] = useState<
    Record<number, number>
  >({});
  const { me } = useAuth();
  const navigate = useNavigate();

  // Load available vouchers
  useEffect(() => {
    console.log('Current user:', me);
    if (visible && me?.id) {
      fetchAvailableVouchers();
    } else if (visible && !me?.id) {
      message.error('Vui lòng đăng nhập để xem danh sách voucher');
      onClose();
      navigate('/login');
    }
  }, [visible, me, onClose, navigate]);

  // Calculate discounts for all vouchers
  useEffect(() => {
    if (vouchers.length > 0) {
      calculateAllDiscounts();
    }
  }, [vouchers, orderAmount]);

  const fetchAvailableVouchers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/user/vouchers/available');
      const filtered = res.data.filter(
        (v: Voucher) => !v.store || v.store.id === storeId
      );
      console.log('Fetched vouchers:', filtered);
      setVouchers(filtered);
    } catch (error: any) {
      console.error('Error fetching vouchers:', error);
      const errorMessage =
        error.response?.status === 401
          ? 'Vui lòng đăng nhập để xem danh sách voucher'
          : error.response?.data?.message || 'Không thể tải danh sách voucher';
      message.error(errorMessage);
      if (error.response?.status === 401) {
        navigate('/login');
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateAllDiscounts = async () => {
    const discounts: Record<number, number> = {};

    for (const voucher of vouchers) {
      if (isVoucherValid(voucher)) {
        try {
          const res = await api.post('/vouchers/calculate-discount', {
            voucherCodes: [voucher.code],
            userId: me?.id,
            orderItems,
            storeId,
            orderAmount,
          });
          console.log(`Discount for voucher ${voucher.code}:`, res.data);
          discounts[voucher.id] = res.data.appliedVouchers[0]?.discount || 0;
        } catch (error) {
          console.error(
            `Error calculating discount for voucher ${voucher.code}:`,
            error
          );
          discounts[voucher.id] = 0;
        }
      }
    }

    setVoucherDiscounts(discounts);
  };

  const formatDiscount = (voucher: Voucher) => {
    if (voucher.discount_type === VoucherDiscountType.PERCENTAGE) {
      const discount = `Giảm ${voucher.discount_value}%`;
      return voucher.max_discount_amount
        ? `${discount} tối đa ${voucher.max_discount_amount.toLocaleString()}đ`
        : discount;
    } else if (voucher.discount_type === VoucherDiscountType.FIXED) {
      return `Giảm ${voucher.discount_value.toLocaleString()}đ`;
    } else {
      return `Hoàn ${voucher.discount_value.toLocaleString()}đ`;
    }
  };

  const handleSelectVoucher = (voucher: Voucher) => {
    if (selectedIds.includes(voucher.id)) {
      setSelectedIds(selectedIds.filter((id) => id !== voucher.id));
      setSelectedTypes(selectedTypes.filter((type) => type !== voucher.type));
    } else {
      // Kiểm tra giới hạn nếu maxSelect không phải Infinity
      if (maxSelect !== Infinity && selectedIds.length >= maxSelect) {
        message.warning(`Chỉ có thể chọn tối đa ${maxSelect} voucher`);
        return;
      }
      if (selectedTypes.includes(voucher.type)) {
        message.warning(
          `Bạn đã chọn một voucher thuộc loại này (${VoucherType[voucher.type]})`
        );
        return;
      }
      setSelectedIds([...selectedIds, voucher.id]);
      setSelectedTypes([...selectedTypes, voucher.type]);
    }
  };

  const handleApplyCode = async () => {
    if (!voucherCode.trim()) {
      message.warning('Vui lòng nhập mã voucher');
      return;
    }

    setApplying(true);
    try {
      const normalizedCode = voucherCode.trim().toUpperCase();
      const res = await api.post('/user/vouchers/apply', {
        code: normalizedCode,
        storeId,
        orderItems,
      });

      const { voucher } = res.data;

      if (selectedIds.includes(voucher.id)) {
        message.info('Voucher này đã được chọn');
      } else if (maxSelect !== Infinity && selectedIds.length >= maxSelect) {
        message.warning(`Chỉ có thể chọn tối đa ${maxSelect} voucher`);
      } else if (selectedTypes.includes(voucher.type)) {
        message.warning(
          `Bạn đã chọn một voucher thuộc loại này (${VoucherType[voucher.type]})`
        );
      } else {
        setSelectedIds([...selectedIds, voucher.id]);
        setSelectedTypes([...selectedTypes, voucher.type]);
        if (!vouchers.find((v) => v.id === voucher.id)) {
          setVouchers([voucher, ...vouchers]);
        }
        message.success('Áp dụng mã voucher thành công');
        setVoucherCode('');
      }
    } catch (error: any) {
      console.error('Error applying voucher:', error);
      message.error(
        error.response?.data?.message || 'Không thể áp dụng voucher'
      );
    } finally {
      setApplying(false);
    }
  };

  const handleConfirm = async () => {
    const selectedVouchers = vouchers.filter((v) => selectedIds.includes(v.id));
    if (selectedVouchers.length === 0) {
      console.log('No vouchers selected, applying empty discount');
      onApply([], 0);
      onClose();
      return;
    }

    try {
      const payload = {
        voucherCodes: selectedVouchers.map((v) => v.code),
        userId: me?.id,
        orderItems,
        storeId,
        orderAmount,
      };
      console.log('Sending calculate-discount payload:', payload);
      const res = await api.post('/vouchers/calculate-discount', payload);
      const { discountTotal, appliedVouchers, invalidVouchers } = res.data;
      console.log('Calculate discount response:', res.data);

      if (invalidVouchers?.length > 0) {
        invalidVouchers.forEach((v: { code: string; error: string }) => {
          message.warning(`Voucher ${v.code}: ${v.error}`);
        });
      }

      onApply(
        selectedVouchers,
        Number.isFinite(discountTotal) ? discountTotal : 0
      );
      message.success(`Áp dụng ${appliedVouchers.length} voucher thành công`);
      onClose();
    } catch (error: any) {
      console.error('Error calculating discount:', error);
      message.error(
        error.response?.data?.message || 'Không thể tính toán giảm giá'
      );
      onApply([], 0);
    }
  };

  const isVoucherValid = (voucher: Voucher) => {
    return orderAmount >= voucher.min_order_amount;
  };

  const filteredVouchers = vouchers.filter(
    (voucher) =>
      !selectedTypes.includes(voucher.type) || selectedIds.includes(voucher.id)
  );

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <TagOutlined />
          <span>Chọn Voucher</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={650}
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
         <div>
            <Tag color="blue">
              {selectedIds.length} đã chọn
              {maxSelect !== Infinity && ` / ${maxSelect}`}
            </Tag>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button onClick={onClose}>Hủy</Button>
            <Button
              type="primary"
              onClick={handleConfirm}
              disabled={selectedIds.length === 0}
            >
              Áp dụng
            </Button>
          </div>
        </div>
      }
    >
      <div style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="Nhập mã voucher"
          enterButton="Áp dụng"
          value={voucherCode}
          onChange={(e) => setVoucherCode(e.target.value)}
          onSearch={handleApplyCode}
          loading={applying}
          size="large"
        />
      </div>

      <Spin spinning={loading}>
        {filteredVouchers.length === 0 ? (
          <Empty description="Không có voucher khả dụng" />
        ) : (
          <List
            dataSource={filteredVouchers}
            renderItem={(voucher) => {
              const isSelected = selectedIds.includes(voucher.id);
              const isValid = isVoucherValid(voucher);
              const discount = voucherDiscounts[voucher.id] || 0;

              return (
                <List.Item
                  style={{
                    border: isSelected
                      ? '2px solid #1890ff'
                      : '1px solid #d9d9d9',
                    borderRadius: 8,
                    marginBottom: 12,
                    padding: 16,
                    cursor: isValid ? 'pointer' : 'not-allowed',
                    opacity: isValid ? 1 : 0.6,
                    background: isSelected ? '#e6f7ff' : 'white',
                  }}
                  onClick={() => isValid && handleSelectVoucher(voucher)}
                >
                  <div style={{ display: 'flex', width: '100%', gap: 12 }}>
                    <div
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: 8,
                        background: voucher.theme_color || '#ff6b6b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: 24,
                        flexShrink: 0,
                      }}
                    >
                      <TagOutlined />
                    </div>

                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 'bold', fontSize: 16 }}>
                            {formatDiscount(voucher)}
                          </div>
                          <div style={{ color: '#666', fontSize: 12 }}>
                            {voucher.title}
                          </div>
                          <div
                            style={{
                              color: '#999',
                              fontSize: 12,
                              marginTop: 4,
                            }}
                          >
                            Mã: <strong>{voucher.code}</strong>
                          </div>
                          {voucher.min_order_amount > 0 && (
                            <div style={{ color: '#999', fontSize: 12 }}>
                              Đơn tối thiểu:{' '}
                              {voucher.min_order_amount.toLocaleString()}đ
                            </div>
                          )}
                          {isValid && discount > 0 && (
                            <Tag color="green" style={{ marginTop: 4 }}>
                              Giảm {discount.toLocaleString()}đ
                            </Tag>
                          )}
                          {!isValid && (
                            <Tag color="red" style={{ marginTop: 4 }}>
                              Không đủ điều kiện
                            </Tag>
                          )}
                        </div>

                        <div>
                          {isSelected ? (
                            <CheckCircleFilled
                              style={{ fontSize: 24, color: '#1890ff' }}
                            />
                          ) : (
                            <div
                              style={{
                                width: 24,
                                height: 24,
                                border: '2px solid #d9d9d9',
                                borderRadius: '50%',
                              }}
                            />
                          )}
                        </div>
                      </div>

                      {voucher.description && (
                        <div
                          style={{
                            fontSize: 12,
                            color: '#999',
                            marginTop: 8,
                            borderTop: '1px dashed #d9d9d9',
                            paddingTop: 8,
                          }}
                        >
                          {voucher.description}
                        </div>
                      )}
                    </div>
                  </div>
                </List.Item>
              );
            }}
          />
        )}
      </Spin>
    </Modal>
  );
};

export default VoucherDiscountSection;
