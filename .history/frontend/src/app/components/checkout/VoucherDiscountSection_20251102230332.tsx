import React, { useState, useEffect } from 'react';
import {
  Modal,
  List,
  Button,
  Input,
  message,
  Tag,
  Empty,
  Spin,
  Tabs,
} from 'antd';
import { TagOutlined, CheckCircleFilled } from '@ant-design/icons';
import { api } from '../../api/api';
import { userVoucherApi, publicVoucherApi } from '../../api/voucher.api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Voucher,
  OrderItem,
  VoucherDiscountType,
  VoucherType,
  VoucherStatus,
} from '../../types/voucher';
import { debounce } from 'lodash';

interface Props {
  visible: boolean;
  onClose: () => void;
  orderItems: OrderItem[];
  storeId: number;
  orderAmount: number;
  onApply: (vouchers: Voucher[], totalDiscount: number) => void;
  selectedVouchers?: Voucher[];
  maxSelect?: number;
  filterByStore?: boolean;
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
  filterByStore = false,
}) => {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [expiredVouchers, setExpiredVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<number[]>([]);
  const [voucherDiscounts, setVoucherDiscounts] = useState<
    Record<number, number>
  >({});
  const [productCategories, setProductCategories] = useState<
    Record<number, number | undefined>
  >({});
  const { me } = useAuth();
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const [visibleCount, setVisibleCount] = useState(6);
  const [invalidVoucherIds, setInvalidVoucherIds] = useState<number[]>([]);
  const [applicableVouchers, setApplicableVouchers] = useState<Voucher[]>([]);
  const [allVouchersCache, setAllVouchersCache] = useState<Voucher[]>([]);
  const [currentTotalDiscount, setCurrentTotalDiscount] = useState(0);
  const [isDataReady, setIsDataReady] = useState(false);

  const subtotal = orderItems.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0
  );

  useEffect(() => {
    if (!visible) {
      setIsDataReady(false);
      setVouchers([]);
      setVoucherDiscounts({});
      setInvalidVoucherIds([]);
      setApplicableVouchers([]);
      setCurrentTotalDiscount(0);
      setSearchText('');
      setVisibleCount(6);
    }
  }, [visible]);

  //  Reset selected state khi modal mở
  useEffect(() => {
    if (visible) {
      console.log('🔄 [VoucherModal] Modal opened, resetting selected state');
      const filteredSelected = selectedVouchers.filter((v) =>
        filterByStore ? v.store_id === storeId : true
      );

      setSelectedIds(filteredSelected.map((v) => v.id));
      setSelectedTypes(filteredSelected.map((v) => v.type));
    }
  }, [visible, selectedVouchers, filterByStore, storeId]);

  //  Load data when modal opens
  useEffect(() => {
    if (visible && me?.id) {
      const loadData = async () => {
        setIsDataReady(false);
        await fetchProductCategories();
        await fetchAvailableVouchers();
        // Data is ready after vouchers are loaded
      };
      loadData();
    } 
  }, [visible, me, onClose, navigate]);

  //  Calculate discounts AFTER vouchers are loaded
  useEffect(() => {
    if (vouchers.length > 0 && applicableVouchers.length > 0) {
      const calculate = async () => {
        await calculateAllDiscounts();
        setIsDataReady(true); //  Mark as ready after calculations
        console.log(' [VoucherModal] Data is ready');
      };
      calculate();
    }
  }, [applicableVouchers.length]); // Only trigger when applicableVouchers changes

  //  Update current total discount when selection changes
  useEffect(() => {
    if (!orderItems?.length || !storeId || !isDataReady) {
      setCurrentTotalDiscount(0);
      return;
    }

    const debouncedFetchDiscount = debounce(async () => {
      if (selectedIds.length === 0) {
        setCurrentTotalDiscount(0);
        return;
      }

      const selectedVouchersForCalc = vouchers.filter((v) =>
        selectedIds.includes(v.id)
      );

      const payload = {
        voucherCodes: selectedVouchersForCalc.map((v) => v.code),
        orderItems: orderItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
        storeId,
        orderAmount: subtotal,
        userId: me?.id ?? 0,
      };

      try {
        const res = await publicVoucherApi.calculateDiscount(payload);
        const { discountTotal } = res;

        const safeDiscount = Math.max(
          0,
          Math.min(subtotal, discountTotal || 0)
        );
        setCurrentTotalDiscount(safeDiscount);
      } catch (error) {
        console.error(' Error calculating discount:', error);
        setCurrentTotalDiscount(0);
      }
    }, 300);

    debouncedFetchDiscount();
    return () => debouncedFetchDiscount.cancel();
  }, [selectedIds, isDataReady]);

  const fetchProductCategories = async () => {
    try {
      const productIds = [...new Set(orderItems.map((item) => item.productId))];
      const categories: Record<number, number | undefined> = {};
      for (const productId of productIds) {
        const res = await api.get(`/products/${productId}`);
        categories[productId] = res.data.category_id;
      }
      setProductCategories(categories);
    } catch (error: any) {
      setProductCategories({});
    }
  };

  const fetchAvailableVouchers = async () => {
    setLoading(true);
    try {
      if (!storeId || storeId === 0) {
        message.error('Không thể xác định cửa hàng');
        setLoading(false);
        return;
      }

      const allVouchers = await userVoucherApi.getAvailableVouchers(storeId, filterByStore);

      console.log('📦 [VoucherModal] Loaded vouchers:', allVouchers.length);

      setApplicableVouchers(allVouchers);

      const mergedList = [
        ...allVouchers,
        ...selectedVouchers.filter(
          (sv: Voucher) => !allVouchers.some((v: Voucher) => v.id === sv.id)
        ),
        ...allVouchersCache.filter(
          (cv: Voucher) =>
            !allVouchers.some((v: Voucher) => v.id === cv.id) &&
            !selectedVouchers.some((sv: Voucher) => sv.id === cv.id)
        ),
      ];

      setVouchers(mergedList);

      setAllVouchersCache((prev) => {
        const newVouchers = [...mergedList];
        const uniqueVouchers = newVouchers.filter(
          (nv) => !prev.some((pv) => pv.id === nv.id)
        );
        return [...prev, ...uniqueVouchers];
      });
    } catch (error: any) {
      message.error('Không thể tải danh sách voucher');    
    } finally {
      setLoading(false);
    }
  };
  console.log('Vouchers after filtering:', vouchers);

  const calculateAllDiscounts = async () => {
    console.log(
      ' [VoucherModal] Calculating discounts for',
      applicableVouchers.length,
      'vouchers'
    );

    const discounts: Record<number, number> = {};
    const invalidIds: number[] = [];

    for (const voucher of applicableVouchers) {
      try {
        const payload = {
          voucherCodes: [voucher.code],
          orderItems: orderItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
          storeId,
          orderAmount: subtotal,
          userId: me?.id ?? 0,
        };

        const res = await publicVoucherApi.calculateDiscount(payload);

        if (res.invalidVouchers?.length > 0) {
          invalidIds.push(voucher.id);
          discounts[voucher.id] = 0;
        } else {
          const discount = res.appliedVouchers[0]?.discount || 0;
          discounts[voucher.id] = discount;
        }
      } catch (error: any) {
        invalidIds.push(voucher.id);
        discounts[voucher.id] = 0;
      }
    }


    setVoucherDiscounts(discounts);
    setInvalidVoucherIds(invalidIds);
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

 const isVoucherDisabled = (voucher: Voucher) => {
  if (!isDataReady) {
    return true;
  }

  const isSelected = selectedIds.includes(voucher.id);
  const discount = voucherDiscounts[voucher.id] || 0;
  const isInvalid = invalidVoucherIds.includes(voucher.id);

  console.log(`🔍 Checking voucher ${voucher.code} (type: ${voucher.type}, store: ${voucher.store_id}, stackable: ${voucher.stackable})`, {
    isSelected,
    discount,
    isInvalid,
    selectedIds,
    selectedTypes
  });

  if (isSelected) return false;

  if (discount === 0 || isInvalid) {
    console.log(`❌ Voucher ${voucher.code} disabled: discount=0 or invalid`);
    return true;
  }

  //  FIX: LUÔN chặn chọn nhiều voucher STORE cùng cửa hàng
  if (voucher.type === VoucherType.STORE) {
    const selectedStoreVouchers = vouchers.filter(
      v => selectedIds.includes(v.id) && 
      v.type === VoucherType.STORE && 
      v.store_id === voucher.store_id
    );



    //  QUAN TRỌNG: LUÔN disable nếu đã có voucher STORE cùng cửa hàng được chọn
    if (selectedStoreVouchers.length > 0) {
      return true;
    }
  } else {
    // Logic cho các loại voucher khác
    const hasSameTypeSelected = selectedTypes.includes(voucher.type);
    if (hasSameTypeSelected && !voucher.stackable) {
      return true;
    }
  }

  const potentialTotal = currentTotalDiscount + discount;
  if (potentialTotal > subtotal) {
    return true;
  }

  return false;
};

  const handleSelectVoucher = (voucher: Voucher) => {
  if (selectedIds.includes(voucher.id)) {
    setSelectedIds(selectedIds.filter((id) => id !== voucher.id));
    setSelectedTypes(selectedTypes.filter((type) => type !== voucher.type));
    message.info(`Đã bỏ chọn voucher ${voucher.code}`);
    return;
  }

  const discount = voucherDiscounts[voucher.id] || 0;

  if (discount === 0) {
    message.warning('Voucher này không áp dụng được cho đơn hàng hiện tại');
    return;
  }

  if (maxSelect !== Infinity && selectedIds.length >= maxSelect) {
    message.warning(`Chỉ có thể chọn tối đa ${maxSelect} voucher`);
    return;
  }

  //  FIX: LUÔN chặn chọn nhiều voucher STORE cùng cửa hàng
  if (voucher.type === VoucherType.STORE) {
    const sameStoreVoucher = vouchers.find(
      (v) =>
        selectedIds.includes(v.id) &&
        v.type === VoucherType.STORE &&
        v.store_id === voucher.store_id
    );

    if (sameStoreVoucher) {
      message.warning(
        `Chỉ có thể chọn 1 voucher cửa hàng cho mỗi cửa hàng. Đã chọn ${sameStoreVoucher.code}`
      );
      return;
    }
  } else {
    // Logic cho các loại voucher khác
    const sameTypeVoucher = vouchers.find(
      (v) =>
        selectedIds.includes(v.id) &&
        v.type === voucher.type
    );

    if (sameTypeVoucher && !voucher.stackable) {
      message.warning(
        `Voucher ${voucher.code} không thể kết hợp với voucher ${sameTypeVoucher.code} cùng loại`
      );
      return;
    }
  }

  const potentialTotal = currentTotalDiscount + discount;
  if (potentialTotal > subtotal) {
    message.warning(
      `Tổng giảm giá sẽ vượt quá giá trị đơn hàng (${subtotal.toLocaleString()}đ)`
    );
    return;
  }

  setSelectedIds([...selectedIds, voucher.id]);
  setSelectedTypes([...selectedTypes, voucher.type]);
  message.success(
    `Đã chọn voucher ${voucher.code} (Giảm ${discount.toLocaleString()}đ)`
  );
};
  const handleApplyCode = async () => {
    if (!voucherCode.trim()) {
      message.warning('Vui lòng nhập mã voucher');
      return;
    }

    setApplying(true);
    try {
      const normalizedCode = voucherCode.trim().toUpperCase();
      const payload = {
        code: normalizedCode,
        storeId,
        orderItems: orderItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
      };
      const res = await userVoucherApi.applyVoucher(payload);

      const { voucher } = res;

      if (selectedIds.includes(voucher.id)) {
        message.info('Voucher này đã được chọn');
      } else if (maxSelect !== Infinity && selectedIds.length >= maxSelect) {
        message.warning(`Chỉ có thể chọn tối đa ${maxSelect} voucher`);
      } else if (selectedTypes.includes(voucher.type) && !voucher.stackable) {
        message.warning('Bạn đã chọn một voucher thuộc loại này');
      } else {
        setSelectedIds([...selectedIds, voucher.id]);
        setSelectedTypes([...selectedTypes, voucher.type]);
        if (!vouchers.find((v: Voucher) => v.id === voucher.id)) {
          setVouchers([voucher, ...vouchers]);
        }
        if (!allVouchersCache.find((v: Voucher) => v.id === voucher.id)) {
          setAllVouchersCache([...allVouchersCache, voucher]);
        }
        message.success('Áp dụng mã voucher thành công');
        setVoucherCode('');
      }
    } catch (error: any) {
      message.error(
        error.response?.data?.message || 'Không thể áp dụng voucher'
      );
    } finally {
      setApplying(false);
    }
  };

  const handleClose = () => {
    const filteredSelected = selectedVouchers.filter((v) =>
      filterByStore ? v.store_id === storeId : true
    );
    setSelectedIds(filteredSelected.map((v) => v.id));
    setSelectedTypes(filteredSelected.map((v) => v.type));
    onClose();
  };

  const handleConfirm = async () => {
    const selectedVouchersToApply = vouchers.filter((v: Voucher) =>
      selectedIds.includes(v.id)
    );

    if (selectedVouchersToApply.length === 0) {
      onApply([], 0);
      message.info('Đã bỏ áp dụng tất cả voucher');
      onClose();
      return;
    }

    try {
      const payload = {
        voucherCodes: selectedVouchersToApply.map((v: Voucher) => v.code),
        orderItems: orderItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
        storeId,
        orderAmount: subtotal,
        userId: me?.id ?? 0,
      };

      const res = await publicVoucherApi.calculateDiscount(payload);
      const { discountTotal, appliedVouchers, invalidVouchers } = res;

      if (invalidVouchers?.length > 0) {
        invalidVouchers.forEach((v: { code: string; error: string }) => {
          message.warning(`Voucher ${v.code}: ${v.error}`);
        });
      }

      const safeDiscountTotal = Math.max(
        0,
        Math.min(subtotal, discountTotal || 0)
      );

      onApply(selectedVouchersToApply, safeDiscountTotal);

      if (appliedVouchers.length > 0) {
        message.success(`Áp dụng ${appliedVouchers.length} voucher thành công`);
      } else {
        message.info('Không có voucher nào được áp dụng');
      }

      onClose();
    } catch (error: any) {
      message.error('Không thể tính toán giảm giá');
      onApply([], 0);
    }
  };

  const getFilteredVouchers = () => {
    let list = [
      ...vouchers,
      ...selectedVouchers.filter(
        (sv: Voucher) => !vouchers.some((v: Voucher) => v.id === sv.id)
      ),
      ...allVouchersCache.filter(
        (cv: Voucher) =>
          !vouchers.some((v: Voucher) => v.id === cv.id) &&
          !selectedVouchers.some((sv: Voucher) => sv.id === cv.id)
      ),
    ];

    if (searchText) {
      list = list.filter(
        (v: Voucher) =>
          v.code.toLowerCase().includes(searchText.toLowerCase()) ||
          v.title.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    return list.sort((a: Voucher, b: Voucher) => {
      const aSelected = selectedIds.includes(a.id) ? 1 : 0;
      const bSelected = selectedIds.includes(b.id) ? 1 : 0;
      if (aSelected !== bSelected) return bSelected - aSelected;
      return (voucherDiscounts[b.id] || 0) - (voucherDiscounts[a.id] || 0);
    });
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
      onCancel={handleClose}
      width={650}
      footer={
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <Tag color={selectedIds.length === 0 ? 'default' : 'blue'}>
              {selectedIds.length} đã chọn
              {maxSelect !== Infinity && ` / ${maxSelect}`}
            </Tag>
            {currentTotalDiscount > 0 && (
              <>
                <Tag color="green" style={{ marginLeft: 8 }}>
                  Giảm: {currentTotalDiscount.toLocaleString()}đ
                </Tag>
                <Tag color="blue" style={{ marginLeft: 8 }}>
                  Còn lại:{' '}
                  {Math.max(
                    0,
                    subtotal - currentTotalDiscount
                  ).toLocaleString()}
                  đ
                </Tag>
              </>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button onClick={handleClose}>Hủy</Button>
            <Button
              type="primary"
              onClick={handleConfirm}
              disabled={!isDataReady}
            >
              {selectedIds.length === 0 ? 'Xác nhận' : 'Áp dụng'}
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
          disabled={!isDataReady}
        />
      </div>

      <Spin
        spinning={loading || !isDataReady}
        tip={!isDataReady ? 'Loading...' : undefined}
      >
        {getFilteredVouchers().length === 0 ? (
          <Empty description="Không có voucher khả dụng" />
        ) : (
          <>
            <List
              dataSource={getFilteredVouchers().slice(0, visibleCount)}
              renderItem={(voucher) => {
                const isSelected = selectedIds.includes(voucher.id);
                const discount = voucherDiscounts[voucher.id] || 0;
                const isDisabled = isVoucherDisabled(voucher);
                const isInvalid = invalidVoucherIds.includes(voucher.id);

                return (
                  <List.Item
                    style={{
                      border: isSelected
                        ? '2px solid #1890ff'
                        : '1px solid #e8e8e8',
                      borderRadius: 8,
                      marginBottom: 12,
                      padding: 16,
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                      background: isSelected ? '#e6f7ff' : 'white',
                      opacity: isDisabled ? 0.4 : 1,
                      pointerEvents: isDisabled ? 'none' : 'auto',
                      transition: 'all 0.3s ease',
                    }}
                    onClick={() => !isDisabled && handleSelectVoucher(voucher)}
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
                            <div
                              style={{
                                fontWeight: 'bold',
                                fontSize: 16,
                              }}
                            >
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
                              borderTop: '1px dashed #e8e8e8',
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
            {getFilteredVouchers().length > visibleCount && (
              <div style={{ textAlign: 'center', marginTop: 8 }}>
                <Button
                  type="link"
                  onClick={() => setVisibleCount(visibleCount + 8)}
                >
                  Xem thêm
                </Button>
              </div>
            )}

            {visibleCount > 8 && (
              <div style={{ textAlign: 'center', marginTop: 4 }}>
                <Button type="link" onClick={() => setVisibleCount(8)}>
                  Thu gọn
                </Button>
              </div>
            )}
          </>
        )}
      </Spin>
    </Modal>
  );
};

export default VoucherDiscountSection;