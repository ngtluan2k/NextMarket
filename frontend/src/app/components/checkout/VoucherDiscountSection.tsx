import React, { useState, useEffect } from 'react';
import { Modal, List, Button, Input, message, Tag, Empty, Spin } from 'antd';
import { TagOutlined, CheckCircleFilled, CloseCircleOutlined } from '@ant-design/icons';
import { api } from '../../api/api';

// Types
interface Voucher {
  id: number;
  uuid: string;
  code: string;
  title: string;
  description?: string;
  type: number;
  discount_type: number;
  discount_value: number;
  max_discount_amount?: number;
  min_order_amount: number;
  start_date: string;
  end_date: string;
  total_usage_limit?: number;
  per_user_limit: number;
  total_used_count: number;
  collected_count: number;
  status: number;
  collection_type: number;
  priority: number;
  stackable: boolean;
  new_user_only: boolean;
  image_url?: string;
  theme_color?: string;
  store?: {
    id: number;
    name: string;
  };
}

interface OrderItem {
  productId: number;
  quantity: number;
  price: number;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  orderItems: OrderItem[];
  storeId: number;
  orderAmount: number;
  onApply: (voucher: Voucher, discount: number) => void;
  selectedVouchers?: Voucher[];
  maxSelect?: number;
}

const VoucherDiscountType = {
  PERCENTAGE: 0,
  FIXED: 1,
  CASH_BACK: 2,
};

const VoucherDiscountSection: React.FC<Props> = ({
  visible,
  onClose,
  orderItems,
  storeId,
  orderAmount,
  onApply,
  selectedVouchers = [],
  maxSelect = 2,
}) => {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>(
    selectedVouchers.map((v) => v.id)
  );

  // Load available vouchers
  useEffect(() => {
    if (visible) {
      fetchAvailableVouchers();
    }
  }, [visible]);

  const fetchAvailableVouchers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/user/vouchers/available');
      // Lọc voucher theo store nếu cần
      const filtered = res.data.filter(
        (v: Voucher) =>
          !v.store || v.store.id === storeId
      );
      setVouchers(filtered);
    } catch (error: any) {
      console.error('Error fetching vouchers:', error);
      message.error(error.response?.data?.message || 'Không thể tải danh sách voucher');
    } finally {
      setLoading(false);
    }
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

  const calculateDiscount = (voucher: Voucher) => {
    let discount = 0;
    if (voucher.discount_type === VoucherDiscountType.PERCENTAGE) {
      discount = (orderAmount * voucher.discount_value) / 100;
      if (voucher.max_discount_amount && discount > voucher.max_discount_amount) {
        discount = voucher.max_discount_amount;
      }
    } else if (voucher.discount_type === VoucherDiscountType.FIXED) {
      discount = voucher.discount_value;
    }
    return discount;
  };

  const handleSelectVoucher = (voucher: Voucher) => {
    if (selectedIds.includes(voucher.id)) {
      setSelectedIds(selectedIds.filter((id) => id !== voucher.id));
    } else {
      if (selectedIds.length >= maxSelect) {
        message.warning(`Chỉ có thể chọn tối đa ${maxSelect} voucher`);
        return;
      }
      setSelectedIds([...selectedIds, voucher.id]);
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

      const { voucher, discount } = res.data;
      
      if (selectedIds.includes(voucher.id)) {
        message.info('Voucher này đã được chọn');
      } else if (selectedIds.length >= maxSelect) {
        message.warning(`Chỉ có thể chọn tối đa ${maxSelect} voucher`);
      } else {
        setSelectedIds([...selectedIds, voucher.id]);
        // Thêm voucher vào danh sách nếu chưa có
        if (!vouchers.find((v) => v.id === voucher.id)) {
          setVouchers([voucher, ...vouchers]);
        }
        message.success(`Áp dụng thành công! Giảm ${discount.toLocaleString()}đ`);
        setVoucherCode('');
      }
    } catch (error: any) {
      console.error('Error applying voucher:', error);
      message.error(error.response?.data?.message || 'Không thể áp dụng voucher');
    } finally {
      setApplying(false);
    }
  };

  const handleConfirm = () => {
    const selectedVouchers = vouchers.filter((v) => selectedIds.includes(v.id));
    let totalDiscount = 0;

    for (const voucher of selectedVouchers) {
      totalDiscount += calculateDiscount(voucher);
    }

    // Gọi callback với voucher đầu tiên (hoặc tùy chỉnh logic)
    if (selectedVouchers.length > 0) {
      onApply(selectedVouchers[0], totalDiscount);
    }
    onClose();
  };

  const isVoucherValid = (voucher: Voucher) => {
    return orderAmount >= voucher.min_order_amount;
  };

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
            <Tag color="blue">{selectedIds.length}/{maxSelect} đã chọn</Tag>
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
        {vouchers.length === 0 ? (
          <Empty description="Không có voucher khả dụng" />
        ) : (
          <List
            dataSource={vouchers}
            renderItem={(voucher) => {
              const isSelected = selectedIds.includes(voucher.id);
              const isValid = isVoucherValid(voucher);
              const discount = calculateDiscount(voucher);

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
                    {/* Icon/Image */}
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

                    {/* Content */}
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
                          <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
                            Mã: <strong>{voucher.code}</strong>
                          </div>
                          {voucher.min_order_amount > 0 && (
                            <div style={{ color: '#999', fontSize: 12 }}>
                              Đơn tối thiểu: {voucher.min_order_amount.toLocaleString()}đ
                            </div>
                          )}
                          {isValid && (
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

                        {/* Checkbox */}
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