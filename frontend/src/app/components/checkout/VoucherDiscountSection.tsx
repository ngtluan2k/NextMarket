import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Input,
  Modal,
  message,
  Tag,
  Spin,
  Empty,
  Typography,
} from 'antd';
import {
  GiftOutlined,
  PercentageOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { api } from '../../../config/api';

const { Text } = Typography;

type Voucher = {
  id: number;
  uuid: string;
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  start_date: string;
  end_date: string;
  usage_limit: number;
  used_count: number;
  applicable_store_ids?: number[]; // Thêm để kiểm tra store
  store?: { id: number; name: string }; // Thêm thông tin store (nếu API trả về)
};

type Props = {
  selectedVouchers?: string[];
  onVoucherChange?: (vouchers: string[]) => void;
  orderAmount?: number;
  maxSelectableVouchers?: number;
  storeId?: number; // Thêm storeId từ CartSidebar
};

const voucherAPI = {
  getActiveVouchers: async (): Promise<Voucher[]> => {
    try {
      const response = await api.get('/vouchers/active');
      return response.data;
    } catch (error) {
      console.error('Error fetching active vouchers:', error);
      return [];
    }
  },

  validateVoucher: async (code: string, orderAmount: number, storeId?: number) => {
    try {
      const response = await api.post('/vouchers/validate', {
        code,
        order_amount: orderAmount,
        store_id: storeId, // Gửi store_id
      });
      return response.data;
    } catch (error: any) {
      return {
        isValid: false,
        message: error.response?.data?.message || 'Lỗi khi xác thực voucher',
      };
    }
  },
};

export const VoucherDiscountSection: React.FC<Props> = ({
  selectedVouchers = [],
  onVoucherChange,
  orderAmount = 0,
  maxSelectableVouchers = 2,
  storeId, // Nhận storeId từ CartSidebar
}) => {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [validatingCode, setValidatingCode] = useState(false);

  useEffect(() => {
    loadVouchers();
  }, []);

  const loadVouchers = async () => {
    setLoading(true);
    try {
      const data = await voucherAPI.getActiveVouchers();
      setVouchers(data);
    } catch (error) {
      message.error('Không thể tải danh sách voucher');
    } finally {
      setLoading(false);
    }
  };

  const handleVoucherSelect = (voucherCode: string) => {
    const voucher = vouchers.find((v) => v.code === voucherCode);
    if (!voucher) return;

    // Kiểm tra store_id (nếu voucher có applicable_store_ids)
    if (
      storeId &&
      voucher.applicable_store_ids &&
      !voucher.applicable_store_ids.includes(storeId)
    ) {
      message.error('Voucher này không áp dụng cho cửa hàng hiện tại');
      return;
    }

    // Kiểm tra điều kiện đơn hàng tối thiểu
    if (voucher.min_order_amount > orderAmount) {
      message.warning(
        `Đơn hàng cần tối thiểu ${voucher.min_order_amount.toLocaleString()}đ để sử dụng voucher này`
      );
      return;
    }

    // Kiểm tra số lượng còn lại
    if (voucher.used_count >= voucher.usage_limit) {
      message.error('Voucher đã hết lượt sử dụng');
      return;
    }

    let newSelection = [...selectedVouchers];

    if (selectedVouchers.includes(voucherCode)) {
      // Bỏ chọn voucher
      newSelection = selectedVouchers.filter((code) => code !== voucherCode);
    } else {
      // Chọn voucher
      if (selectedVouchers.length >= maxSelectableVouchers) {
        message.warning(
          `Chỉ có thể chọn tối đa ${maxSelectableVouchers} voucher`
        );
        return;
      }
      newSelection.push(voucherCode);
    }

    onVoucherChange?.(newSelection);
  };

  const handleCodeInput = async () => {
    if (!inputCode.trim()) {
      message.warning('Vui lòng nhập mã voucher');
      return;
    }

    setValidatingCode(true);
    try {
      const result = await voucherAPI.validateVoucher(
        inputCode.trim().toUpperCase(),
        orderAmount,
        storeId // Truyền storeId
      );

      if (result.isValid && result.voucher) {
        // Thêm voucher vào danh sách nếu chưa có
        const existingVoucher = vouchers.find(
          (v) => v.code === result.voucher.code
        );
        if (!existingVoucher) {
          setVouchers((prev) => [...prev, result.voucher]);
        }

        handleVoucherSelect(result.voucher.code);
        setInputCode('');
        message.success('Áp dụng voucher thành công');
      } else {
        message.error(result.message || 'Mã voucher không hợp lệ');
      }
    } catch (error) {
      message.error('Không thể xác thực mã voucher');
    } finally {
      setValidatingCode(false);
    }
  };

  const formatDiscount = (voucher: Voucher) => {
    if (voucher.discount_type === 'percentage') {
      return `${voucher.discount_value}%`;
    }
    return `${voucher.discount_value.toLocaleString()}đ`;
  };

  const getDiscountIcon = (type: string) => {
    return type === 'percentage' ? <PercentageOutlined /> : <DollarOutlined />;
  };

  const getRemainingCount = (voucher: Voucher) => {
    return voucher.usage_limit - voucher.used_count;
  };

  const getUsagePercentage = (voucher: Voucher) => {
    return Math.round((voucher.used_count / voucher.usage_limit) * 100);
  };

  const isVoucherAvailable = (voucher: Voucher) => {
    return (
      voucher.used_count < voucher.usage_limit &&
      voucher.min_order_amount <= orderAmount &&
      (!storeId ||
        !voucher.applicable_store_ids ||
        voucher.applicable_store_ids.includes(storeId))
    );
  };

  const calculateDiscountAmount = (
    voucher: Voucher,
    orderAmount: number
  ): number => {
    if (voucher.discount_type === 'percentage') {
      return (orderAmount * voucher.discount_value) / 100;
    }
    return voucher.discount_value;
  };

  const getTotalDiscount = (): number => {
    return selectedVouchers.reduce((total, code) => {
      const voucher = vouchers.find((v) => v.code === code);
      if (!voucher) return total;
      return total + calculateDiscountAmount(voucher, orderAmount);
    }, 0);
  };

  return (
    <Card style={{ marginBottom: 16 }}>
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <GiftOutlined style={{ color: '#1890ff' }} />
          <Text strong>Khuyến Mãi</Text>
        </div>
        <div className="flex items-center gap-2">
          <Text type="secondary" style={{ fontSize: 12 }}>
            Có thể chọn {maxSelectableVouchers}
          </Text>
          <Button
            type="link"
            size="small"
            onClick={() => setModalVisible(true)}
          >
            Xem tất cả
          </Button>
        </div>
      </div>

      {/* Vouchers đã chọn */}
      {selectedVouchers.length > 0 && (
        <div className="flex flex-col gap-2 mb-3">
          {selectedVouchers.map((code) => {
            const voucher = vouchers.find((v) => v.code === code);
            if (!voucher) return null;

            return (
              <div
                key={code}
                className="flex items-center justify-between p-3 border-2 border-blue-500 rounded-lg bg-blue-50"
              >
                <div className="flex items-center gap-2">
                  {getDiscountIcon(voucher.discount_type)}
                  <div>
                    <Text strong className="text-blue-600">
                      {voucher.description} - Giảm {formatDiscount(voucher)}
                    </Text>
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Mã: {voucher.code} • Còn {getRemainingCount(voucher)}{' '}
                        lượt
                        {voucher.store ? ` • Cửa hàng: ${voucher.store.name}` : ''}
                      </Text>
                    </div>
                  </div>
                </div>
                <Button
                  size="small"
                  type="primary"
                  danger
                  onClick={() => handleVoucherSelect(code)}
                >
                  Bỏ chọn
                </Button>
              </div>
            );
          })}

          {/* Hiển thị tổng giảm giá */}
          <div className="text-right">
            <Text strong style={{ color: '#52c41a' }}>
              Tổng giảm: -{getTotalDiscount().toLocaleString()}đ
            </Text>
          </div>
        </div>
      )}

      {/* Nhập mã voucher */}
      <div className="flex gap-2">
        <Input
          placeholder="Nhập mã voucher"
          value={inputCode}
          onChange={(e) => setInputCode(e.target.value.toUpperCase())}
          onPressEnter={handleCodeInput}
          style={{ flex: 1 }}
        />
        <Button
          type="primary"
          onClick={handleCodeInput}
          loading={validatingCode}
        >
          Áp dụng
        </Button>
      </div>

      {/* Modal danh sách voucher */}
      <Modal
        title="Chọn Voucher"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <div style={{ maxHeight: 400, overflowY: 'auto' }}>
          {loading ? (
            <div className="text-center py-8">
              <Spin size="large" />
            </div>
          ) : vouchers.length === 0 ? (
            <Empty description="Không có voucher nào" />
          ) : (
            <div className="flex flex-col gap-3">
              {vouchers.map((voucher) => {
                const isSelected = selectedVouchers.includes(voucher.code);
                const isAvailable = isVoucherAvailable(voucher);
                const remaining = getRemainingCount(voucher);
                const usagePercent = getUsagePercentage(voucher);

                return (
                  <div
                    key={voucher.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : isAvailable
                        ? 'border-gray-200 hover:border-blue-300'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                    onClick={() =>
                      isAvailable && handleVoucherSelect(voucher.code)
                    }
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-3 flex-1">
                        <div
                          className={`p-2 rounded ${
                            isAvailable ? 'bg-blue-100' : 'bg-gray-100'
                          }`}
                        >
                          {getDiscountIcon(voucher.discount_type)}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Text
                              strong
                              className={
                                isAvailable ? 'text-blue-600' : 'text-gray-500'
                              }
                            >
                              Giảm {formatDiscount(voucher)}
                            </Text>
                            {remaining <= 10 && remaining > 0 && (
                              <Tag
                                color="orange"
                                style={{
                                  fontSize: 11,
                                  padding: '0 4px',
                                  lineHeight: '18px',
                                  height: '18px',
                                }}
                              >
                                Sắp hết
                              </Tag>
                            )}
                            {remaining === 0 && (
                              <Tag
                                color="red"
                                style={{
                                  fontSize: 11,
                                  padding: '0 4px',
                                  lineHeight: '18px',
                                  height: '18px',
                                }}
                              >
                                Hết lượt
                              </Tag>
                            )}
                          </div>

                          <Text type="secondary" style={{ fontSize: 13 }}>
                            {voucher.description}
                          </Text>

                          <div className="mt-2">
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              Mã: {voucher.code} • Đơn tối thiểu:{' '}
                              {voucher.min_order_amount.toLocaleString()}đ
                              {voucher.store ? ` • Cửa hàng: ${voucher.store.name}` : ''}
                            </Text>
                          </div>

                          <div className="mt-2 flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  usagePercent >= 90
                                    ? 'bg-red-500'
                                    : usagePercent >= 70
                                    ? 'bg-orange-500'
                                    : 'bg-green-500'
                                }`}
                                style={{ width: `${usagePercent}%` }}
                              />
                            </div>
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              Còn {remaining}/{voucher.usage_limit}
                            </Text>
                          </div>
                        </div>
                      </div>

                      <Button
                        size="small"
                        type={isSelected ? 'primary' : 'default'}
                        disabled={!isAvailable}
                      >
                        {isSelected
                          ? 'Đã chọn'
                          : isAvailable
                          ? 'Chọn'
                          : 'Không đủ điều kiện'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Modal>
    </Card>
  );
};