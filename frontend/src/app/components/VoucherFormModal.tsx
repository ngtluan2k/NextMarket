import React, { useEffect, useState } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  DatePicker,
  Row,
  Col,
  Switch,
} from 'antd';
import {
  Voucher,
  VoucherType,
  VoucherDiscountType,
  VoucherStatus,
  VoucherCollectionType,
} from '../types/voucher';  // Giả định đường dẫn đúng
import dayjs from 'dayjs';
import { api, API_ENDPOINTS } from '../api/api';  // Giả định đường dẫn đúng

const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

interface VoucherFormModalProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  editingVoucher: Voucher | null;
  loading: boolean;
  form: any;
  stores: { id: number; name: string }[];
  categories: { id: number; name: string; store_id?: number }[];
  products: { id: number; name: string; category_id?: number }[];
  isStoreOwner?: boolean;
  currentStoreId?: number;
}

const VoucherFormModal: React.FC<VoucherFormModalProps> = ({
  visible,
  onCancel,
  onSubmit,
  editingVoucher,
  loading,
  form,
  stores,
  categories: initialCategories,
  products: initialProducts,
  isStoreOwner = false,
  currentStoreId,
}) => {
  const [categories, setCategories] =
    useState<{ id: number; name: string; store_id?: number }[]>(
      initialCategories
    );
  const [products, setProducts] =
    useState<{ id: number; name: string; category_id?: number }[]>(
      initialProducts
    );
  const [fetchingCategories, setFetchingCategories] = useState(false);
  const [fetchingProducts, setFetchingProducts] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Theo dõi giá trị của type, applicable_store_ids và applicable_category_ids
  const voucherType = Form.useWatch('type', form) || VoucherType.PLATFORM;
  const selectedStoreIds =
    Form.useWatch('applicable_store_ids', form) ||
    (isStoreOwner && currentStoreId ? [currentStoreId] : []);
  const selectedCategoryIds =
    Form.useWatch('applicable_category_ids', form) || [];

  // Reset fields khi type thay đổi (ẩn/hiện và xóa giá trị không cần)
  useEffect(() => {
    if (!visible) return;

    // Dựa trên type, reset fields không áp dụng
    if (voucherType === VoucherType.PLATFORM || voucherType === VoucherType.SHIPPING) {
      form.setFieldsValue({
        applicable_store_ids: [],
        applicable_category_ids: [],
        applicable_product_ids: [],
        excluded_product_ids: [],
      });
      setCategories([]);
      setProducts([]);
    } else if (voucherType === VoucherType.STORE) {
      form.setFieldsValue({
        applicable_category_ids: [],
        applicable_product_ids: [],
        excluded_product_ids: [],
      });
      setProducts([]);
      // Giữ applicable_store_ids, fetch categories nếu cần
    } else if (voucherType === VoucherType.CATEGORY) {
      form.setFieldsValue({
        applicable_product_ids: [],
        excluded_product_ids: [],
      });
      setProducts([]);
      // Giữ store và category
    }
    // Với PRODUCT: Giữ tất cả
  }, [voucherType, visible, form]);

  // Kiểm tra xem có nên hiển thị các trường hay không (dựa trên type và giá trị cũ khi edit)
  const shouldShowStores = 
    voucherType === VoucherType.STORE ||
    voucherType === VoucherType.CATEGORY ||
    voucherType === VoucherType.PRODUCT ||
    (editingVoucher?.applicable_store_ids && editingVoucher.applicable_store_ids.length > 0);

  const shouldShowCategories =
    (voucherType === VoucherType.CATEGORY || voucherType === VoucherType.PRODUCT) &&
    (selectedStoreIds.length > 0 ||
      (editingVoucher?.applicable_category_ids &&
        editingVoucher.applicable_category_ids.length > 0));

  const shouldShowProducts =
    voucherType === VoucherType.PRODUCT &&
    (selectedCategoryIds.length > 0 ||
      (editingVoucher?.applicable_product_ids &&
        editingVoucher.applicable_product_ids.length > 0) ||
      (editingVoucher?.excluded_product_ids &&
        editingVoucher.excluded_product_ids.length > 0));

  // Reset khi modal mở/đóng (giữ nguyên code cũ của bạn)
  useEffect(() => {
    if (visible) {
      setInitialLoadComplete(false);

      // Nếu là store owner, set default store_ids
      if (isStoreOwner && currentStoreId) {
        form.setFieldsValue({ applicable_store_ids: [currentStoreId] });
      }

      // Nếu đang edit, fetch dữ liệu cần thiết
      const loadInitialData = async () => {
        if (editingVoucher) {
          // Fetch categories nếu có store_ids
          if (
            editingVoucher.applicable_store_ids &&
            editingVoucher.applicable_store_ids.length > 0
          ) {
            await fetchCategoriesByStoreIds(
              editingVoucher.applicable_store_ids
            );
          }

          // Fetch products nếu có category_ids
          if (
            editingVoucher.applicable_category_ids &&
            editingVoucher.applicable_category_ids.length > 0
          ) {
            await fetchProductsByCategoryIds(
              editingVoucher.applicable_category_ids
            );
          }
        }

        setInitialLoadComplete(true);
      };

      loadInitialData();
    } else {
      setInitialLoadComplete(false);
      setCategories(initialCategories);
      setProducts(initialProducts);
    }
  }, [
    visible,
    editingVoucher,
    isStoreOwner,
    currentStoreId,
    form,
    initialCategories,
    initialProducts,
  ]);

  // Hàm fetch categories (giữ nguyên)
  const fetchCategoriesByStoreIds = async (storeIds: number[]) => {
    if (storeIds.length === 0) {
      setCategories([]);
      return;
    }

    try {
      setFetchingCategories(true);
      const response = await api.get(
        `${API_ENDPOINTS.categories}?store_ids=${storeIds.join(',')}`
      );
      const fetchedCategories = response.data?.data || response.data || [];
      setCategories(fetchedCategories);
    } catch (error) {
      console.error('Lỗi khi lấy danh mục:', error);
      setCategories([]);
    } finally {
      setFetchingCategories(false);
    }
  };

  // Hàm fetch products (giữ nguyên)
  const fetchProductsByCategoryIds = async (categoryIds: number[]) => {
    if (categoryIds.length === 0) {
      setProducts([]);
      return;
    }

    try {
      setFetchingProducts(true);
      const response = await api.get(
        `${API_ENDPOINTS.products}?category_ids=${categoryIds.join(',')}`
      );
      const fetchedProducts = response.data?.data || response.data || [];
      setProducts(fetchedProducts);
    } catch (error) {
      console.error('Lỗi khi lấy sản phẩm:', error);
      setProducts([]);
    } finally {
      setFetchingProducts(false);
    }
  };

  // Lấy danh sách danh mục dựa trên store_ids (giữ nguyên)
  useEffect(() => {
    if (!visible || !initialLoadComplete) return;

    if (selectedStoreIds.length > 0 && (voucherType === VoucherType.CATEGORY || voucherType === VoucherType.PRODUCT)) {
      fetchCategoriesByStoreIds(selectedStoreIds);
    } else if (voucherType !== VoucherType.CATEGORY && voucherType !== VoucherType.PRODUCT) {
      setCategories([]);
      form.setFieldsValue({
        applicable_category_ids: [],
        applicable_product_ids: [],
        excluded_product_ids: [],
      });
    }
  }, [selectedStoreIds, visible, initialLoadComplete, form, voucherType]);

  // Lấy danh sách sản phẩm dựa trên category_ids (giữ nguyên)
  useEffect(() => {
    if (!visible || !initialLoadComplete) return;

    if (selectedCategoryIds.length > 0 && voucherType === VoucherType.PRODUCT) {
      fetchProductsByCategoryIds(selectedCategoryIds);
    } else if (voucherType !== VoucherType.PRODUCT) {
      setProducts([]);
      form.setFieldsValue({
        applicable_product_ids: [],
        excluded_product_ids: [],
      });
    }
  }, [selectedCategoryIds, visible, initialLoadComplete, form, voucherType]);

  

  return (
    <Modal
      title={editingVoucher ? 'Chỉnh Sửa Voucher' : 'Thêm Voucher Mới'}
      open={visible}
      onCancel={onCancel}
      onOk={onSubmit}
      width={900}
      confirmLoading={loading}
      okText={editingVoucher ? 'Cập Nhật' : 'Tạo Mới'}
      cancelText="Hủy"
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Mã Voucher"
              name="code"
              rules={[{ required: true, message: 'Vui lòng nhập mã voucher' }]}
            >
              <Input placeholder="Ví dụ: FREESHIP2023" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Tiêu Đề"
              name="title"
              rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
            >
              <Input placeholder="Giảm 20% cho đơn hàng đầu tiên" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Mô Tả" name="description">
          <TextArea rows={2} placeholder="Mô tả chi tiết voucher..." />
        </Form.Item>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="Loại Voucher"
              name="type"
              initialValue={VoucherType.PLATFORM}
              rules={[{ required: true, message: 'Chọn loại voucher' }]}
            >
              <Select>
                <Option value={VoucherType.SHIPPING}>
                  Freeship (Vận chuyển miễn phí)
                </Option>
                <Option value={VoucherType.PRODUCT}>
                  Giảm giá sản phẩm cụ thể
                </Option>
                <Option value={VoucherType.STORE}>Voucher cửa hàng</Option>
                <Option value={VoucherType.CATEGORY}>Voucher danh mục</Option>
                <Option value={VoucherType.PLATFORM}>Voucher toàn sàn</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="Kiểu Giảm Giá"
              name="discount_type"
              rules={[{ required: true, message: 'Chọn kiểu giảm giá' }]}
              initialValue={VoucherDiscountType.PERCENTAGE}
            >
              <Select>
                <Option value={VoucherDiscountType.PERCENTAGE}>
                  Phần trăm (%)
                </Option>
                <Option value={VoucherDiscountType.FIXED}>Cố định (VND)</Option>
                <Option value={VoucherDiscountType.CASH_BACK}>Hoàn tiền</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="Giá Trị Giảm"
              name="discount_value"
              rules={[{ required: true, message: 'Nhập giá trị giảm' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                placeholder="Ví dụ: 20 (cho 20%) hoặc 50000 (cho cố định)"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              noStyle
              shouldUpdate={(prev, curr) =>
                prev.discount_type !== curr.discount_type
              }
            >
              {({ getFieldValue }) =>
                getFieldValue('discount_type') ===
                VoucherDiscountType.PERCENTAGE ? (
                  <Form.Item
                    label="Giảm Tối Đa (VND)"
                    name="max_discount_amount"
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      formatter={(value) =>
                        `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                      }
                      placeholder="Ví dụ: 100000"
                    />
                  </Form.Item>
                ) : null
              }
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Đơn Hàng Tối Thiểu (VND)"
              name="min_order_amount"
              initialValue={0}
              rules={[
                {
                  validator: (_, value) => {
                    const discountType = form.getFieldValue('discount_type');
                    const discountValue = form.getFieldValue('discount_value');

                    // Nếu là kiểu giảm cố định, phải đảm bảo min_order >= discount
                    if (discountType === VoucherDiscountType.FIXED) {
                      if (value < discountValue) {
                        return Promise.reject(
                          new Error(
                            'Đơn hàng tối thiểu phải lớn hơn hoặc bằng giá trị giảm'
                          )
                        );
                      }
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                formatter={(value) =>
                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                }
                placeholder="Ví dụ: 50000"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              label="Thời Gian Hiệu Lực"
              name="dateRange"
              rules={[{ required: true, message: 'Chọn thời gian hiệu lực' }]}
            >
              <RangePicker
                style={{ width: '100%' }}
                showTime
                format="DD/MM/YYYY HH:mm"
                placeholder={['Ngày bắt đầu', 'Ngày kết thúc']}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="Tổng Lượt Dùng" name="total_usage_limit">
              <InputNumber
                style={{ width: '100%' }}
                min={1}
                placeholder="Không giới hạn nếu bỏ trống"
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="Lượt Dùng/Người"
              name="per_user_limit"
              initialValue={1}
              rules={[{ required: true, message: 'Nhập lượt dùng mỗi người' }]}
            >
              <InputNumber style={{ width: '100%' }} min={1} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Giới Hạn Lượt Lưu" name="collection_limit">
              <InputNumber
                style={{ width: '100%' }}
                min={1}
                placeholder="Không giới hạn nếu bỏ trống"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="Trạng Thái"
              name="status"
              initialValue={VoucherStatus.DRAFT}
              rules={[{ required: true, message: 'Chọn trạng thái' }]}
            >
              <Select>
                <Option value={VoucherStatus.ACTIVE}>Đang hoạt động</Option>
                <Option value={VoucherStatus.DRAFT}>Bản nháp</Option>
                <Option value={VoucherStatus.PAUSED}>Tạm dừng</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="Kiểu Nhận Voucher"
              name="collection_type"
              initialValue={VoucherCollectionType.MANUAL}
              rules={[{ required: true, message: 'Chọn kiểu nhận' }]}
            >
              <Select>
                <Option value={VoucherCollectionType.AUTO}>
                  Tự động áp dụng
                </Option>
                <Option value={VoucherCollectionType.MANUAL}>
                  Thu thập thủ công
                </Option>
                <Option value={VoucherCollectionType.TARGETED}>
                  Định hướng người dùng
                </Option>
                <Option value={VoucherCollectionType.EVENT}>
                  Dành cho sự kiện
                </Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Độ Ưu Tiên" name="priority" initialValue={0}>
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                placeholder="Số càng cao càng ưu tiên"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="Cho Phép Kết Hợp"
              name="stackable"
              valuePropName="checked"
              initialValue={true}
            >
              <Switch checkedChildren="Có" unCheckedChildren="Không" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="Chỉ Người Dùng Mới"
              name="new_user_only"
              valuePropName="checked"
              initialValue={false}
            >
              <Switch checkedChildren="Có" unCheckedChildren="Không" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="Màu Chủ Đề"
              name="theme_color"
              initialValue="#FF6B6B"
            >
              <Input type="color" style={{ width: 100 }} />
            </Form.Item>
          </Col>
        </Row>

        {/* Conditional rendering dựa trên type */}
        {!isStoreOwner && shouldShowStores && (
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Cửa Hàng Áp Dụng (ID)"
                name="applicable_store_ids"
              >
                <Select
                  mode="multiple"
                  placeholder="Chọn cửa hàng (để trống nếu áp dụng tất cả)"
                  allowClear
                  showSearch
                  filterOption={(input, option) =>
                    (option?.children as unknown as string)
                      ?.toLowerCase()
                      .includes(input.toLowerCase())
                  }
                >
                  {stores.map((store) => (
                    <Option key={store.id} value={store.id}>
                      {store.name} (ID: {store.id})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        )}

        {shouldShowCategories && (
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Danh Mục Áp Dụng (ID)"
                name="applicable_category_ids"
              >
                <Select
                  mode="multiple"
                  placeholder="Chọn danh mục (để trống nếu áp dụng tất cả)"
                  allowClear
                  showSearch
                  loading={fetchingCategories}
                  filterOption={(input, option) =>
                    (option?.children as unknown as string)
                      ?.toLowerCase()
                      .includes(input.toLowerCase())
                  }
                >
                  {categories.map((category) => (
                    <Option key={category.id} value={category.id}>
                      {category.name} (ID: {category.id})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        )}

        {shouldShowProducts && (
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Sản Phẩm Áp Dụng (ID)"
                name="applicable_product_ids"
              >
                <Select
                  mode="multiple"
                  placeholder="Chọn sản phẩm (để trống nếu áp dụng tất cả)"
                  allowClear
                  showSearch
                  loading={fetchingProducts}
                  filterOption={(input, option) =>
                    (option?.children as unknown as string)
                      ?.toLowerCase()
                      .includes(input.toLowerCase())
                  }
                >
                  {products.map((product) => (
                    <Option key={product.id} value={product.id}>
                      {product.name} (ID: {product.id})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Sản Phẩm Loại Trừ (ID)"
                name="excluded_product_ids"
              >
                <Select
                  mode="multiple"
                  placeholder="Chọn sản phẩm loại trừ (để trống nếu không loại trừ)"
                  allowClear
                  showSearch
                  loading={fetchingProducts}
                  filterOption={(input, option) =>
                    (option?.children as unknown as string)
                      ?.toLowerCase()
                      .includes(input.toLowerCase())
                  }
                >
                  {products.map((product) => (
                    <Option key={product.id} value={product.id}>
                      {product.name} (ID: {product.id})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        )}

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Điều Kiện Người Dùng (JSON)"
              name="user_conditions"
              rules={[
                {
                  validator: (_, value) =>
                    value && value.trim()
                      ? JSON.parse(value)
                        ? Promise.resolve()
                        : Promise.reject('Vui lòng nhập JSON hợp lệ')
                      : Promise.resolve(),
                },
              ]}
            >
              <Input placeholder='Ví dụ: {"min_orders": 1, "vip_level": ["gold"], "user_tags": ["new"]}' />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Giới Hạn Thời Gian (JSON)"
              name="time_restrictions"
              rules={[
                {
                  validator: (_, value) =>
                    value && value.trim()
                      ? JSON.parse(value)
                        ? Promise.resolve()
                        : Promise.reject('Vui lòng nhập JSON hợp lệ')
                      : Promise.resolve(),
                },
              ]}
            >
              <Input placeholder='Ví dụ: {"days_of_week": [1,2,3], "hours": [{"start": "09:00", "end": "18:00"}]}' />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default VoucherFormModal;