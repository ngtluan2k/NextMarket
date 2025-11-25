// VoucherManager.tsx
import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Card,
  Statistic,
  Tag,
  Row,
  Col,
  message,
  Input,
  Select,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import { voucherApi } from '../../api/voucher.api';
import { api, API_ENDPOINTS } from '../../api/api';
import {
  VoucherType,
  VoucherDiscountType,
  VoucherStatus,
  Voucher,
  CreateVoucherPayload,
} from '../../types/voucher';
import VoucherFormModal from '../VoucherFormModal';
import { Form } from 'antd';

dayjs.locale('vi');

const { Option } = Select;

const VoucherManager: React.FC = () => {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [filteredVouchers, setFilteredVouchers] = useState<Voucher[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<VoucherStatus | null>(null);
  const [typeFilter, setTypeFilter] = useState<VoucherType | null>(null);
  const [stores, setStores] = useState<{ id: number; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>(
    []
  );
  const [products, setProducts] = useState<{ id: number; name: string }[]>([]);
  const [form] = Form.useForm();

  // Thống kê
  const totalVouchers = vouchers.length;
  const activeVouchers = vouchers.filter(
    (v) => v.status === VoucherStatus.ACTIVE
  ).length;
  const expiredVouchers = vouchers.filter(
    (v) => v.status === VoucherStatus.EXPIRED
  ).length;
  const depletedVouchers = vouchers.filter(
    (v) => v.status === VoucherStatus.DEPLETED
  ).length;

  // Lấy dữ liệu từ API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [storeResponse, categoryResponse, productResponse] =
          await Promise.all([
            api.get(API_ENDPOINTS.stores),
            api.get(API_ENDPOINTS.categories),
            api.get(API_ENDPOINTS.products),
          ]);

        setStores(storeResponse.data?.data || storeResponse.data || []);
        setCategories(
          categoryResponse.data?.data || categoryResponse.data || []
        );
        setProducts(productResponse.data?.data || productResponse.data || []);
        await fetchVouchers();
      } catch (err: any) {
        console.error('Lỗi tải dữ liệu:', err);
        if (err.response?.status === 403) {
          message.error('Bạn không có quyền xem danh sách cửa hàng');
        } else {
          message.error('Không thể tải dữ liệu từ server');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    fetchVouchers();
  }, []);

  useEffect(() => {
    handleFilterAndSearch();
  }, [vouchers, searchText, statusFilter, typeFilter]);

  // Fetch vouchers
  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const data = await voucherApi.getAllVouchers();
      const voucherData = Array.isArray(data) ? data : [];
      setVouchers(voucherData);
    } catch (err: any) {
      console.error('Fetch vouchers failed:', err);
      message.error(
        err.response?.data?.message || 'Không thể tải danh sách voucher'
      );
      setVouchers([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter and search
  const handleFilterAndSearch = () => {
    let data = [...vouchers];

    if (searchText.trim()) {
      const search = searchText.toLowerCase();
      data = data.filter(
        (v) =>
          v.code.toLowerCase().includes(search) ||
          v.title.toLowerCase().includes(search) ||
          (v.description && v.description.toLowerCase().includes(search))
      );
    }

    if (statusFilter !== null) {
      data = data.filter((v) => v.status === statusFilter);
    }

    if (typeFilter !== null) {
      data = data.filter((v) => v.type === typeFilter);
    }

    setFilteredVouchers(data);
  };

  // Create/Update voucher
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // Parse user_conditions JSON
      let parsedUserConditions;
      if (values.user_conditions) {
        try {
          parsedUserConditions = JSON.parse(values.user_conditions);
          if (
            typeof parsedUserConditions !== 'object' ||
            parsedUserConditions === null
          ) {
            throw new Error('Không phải object');
          }
        } catch {
          message.error('Điều kiện người dùng phải là JSON hợp lệ (object)');
          setLoading(false);
          return;
        }
      }

      // Parse time_restrictions JSON
      let parsedTimeRestrictions;
      if (values.time_restrictions) {
        try {
          parsedTimeRestrictions = JSON.parse(values.time_restrictions);
          if (
            typeof parsedTimeRestrictions !== 'object' ||
            parsedTimeRestrictions === null
          ) {
            throw new Error('Không phải object');
          }
        } catch {
          message.error('Giới hạn thời gian phải là JSON hợp lệ (object)');
          setLoading(false);
          return;
        }
      }

      // ✅ FIX: Parse applicable_user_ids - hỗ trợ nhiều format
      let parsedApplicableUserIds;

      // 🔄 Nếu đang edit, lấy danh sách cũ làm base
      const existingUserIds = editingVoucher?.applicable_user_ids || [];

      if (values.applicable_user_ids) {
        try {
          const input = values.applicable_user_ids;

          // Nếu đã là array (từ Select mode="tags"), chỉ cần convert sang number
          if (Array.isArray(input)) {
            parsedApplicableUserIds = input
              .map(id => {
                const num = typeof id === 'number' ? id : parseInt(id.toString(), 10);
                return num;
              })
              .filter(id => !isNaN(id) && id > 0);
          }
          // Nếu là string (từ TextArea)
          else if (typeof input === 'string') {
            const trimmed = input.trim();

            // Nếu rỗng, bỏ qua
            if (!trimmed) {
              parsedApplicableUserIds = undefined;
            }
            // Format 1: JSON array "[1,2,3]"
            else if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
              const parsed = JSON.parse(trimmed);
              if (!Array.isArray(parsed)) {
                throw new Error('JSON phải là array');
              }
              parsedApplicableUserIds = parsed.map(Number).filter(id => !isNaN(id) && id > 0);
            }
            // Format 2: Số đơn lẻ "1" hoặc "123"
            else if (/^\d+$/.test(trimmed)) {
              const num = parseInt(trimmed, 10);
              if (isNaN(num) || num <= 0) {
                throw new Error('Số không hợp lệ');
              }
              parsedApplicableUserIds = [num];
            }
            // Format 3: Danh sách phân cách dấu phẩy "1,2,3" hoặc "1, 2, 3"
            else if (/^[\d,\s]+$/.test(trimmed)) {
              parsedApplicableUserIds = trimmed
                .split(',')
                .map(s => parseInt(s.trim(), 10))
                .filter(id => !isNaN(id) && id > 0);
            }
            // Format không hợp lệ
            else {
              throw new Error('Format không hợp lệ');
            }
          }

          // Validate kết quả cuối cùng
          if (parsedApplicableUserIds !== undefined) {
            if (!Array.isArray(parsedApplicableUserIds) || parsedApplicableUserIds.length === 0) {
              throw new Error('Phải có ít nhất 1 ID hợp lệ');
            }

            if (!parsedApplicableUserIds.every((id: any) =>
              typeof id === 'number' && !isNaN(id) && id > 0
            )) {
              throw new Error('Tất cả ID phải là số nguyên dương');
            }

            // 🔄 Nếu đang edit: MERGE với danh sách cũ (bổ sung, không thay thế)
            if (editingVoucher && existingUserIds.length > 0) {
              // Kết hợp cũ + mới, loại bỏ trùng lặp
              const mergedIds = [...new Set([...existingUserIds, ...parsedApplicableUserIds])];
              parsedApplicableUserIds = mergedIds;
              console.log('🔄 MERGE user IDs:', {
                old: existingUserIds,
                new: parsedApplicableUserIds,
                merged: mergedIds
              });
            }
          }

        } catch (error) {
          console.error('Parse applicable_user_ids error:', error);
          message.error(
            'ID Người Dùng Áp Dụng không hợp lệ. ' +
            'Hỗ trợ format: [1,2,3] hoặc 1,2,3 hoặc 1'
          );
          setLoading(false);
          return;
        }
      }

      // Build payload
      const payload: CreateVoucherPayload = {
        code: values.code.trim().toUpperCase(),
        title: values.title,
        description: values.description,
        type: values.type,
        discount_type: values.discount_type,
        discount_value: Number(values.discount_value) || 0,
        max_discount_amount: values.max_discount_amount
          ? Number(values.max_discount_amount)
          : undefined,
        min_order_amount: values.min_order_amount
          ? Number(values.min_order_amount)
          : 0,
        start_date: values.dateRange[0].toISOString(),
        end_date: values.dateRange[1].toISOString(),
        total_usage_limit: values.total_usage_limit
          ? Number(values.total_usage_limit)
          : undefined,
        per_user_limit: values.per_user_limit
          ? Number(values.per_user_limit)
          : 1,
        collection_limit: values.collection_limit
          ? Number(values.collection_limit)
          : undefined,
        status: values.status,
        collection_type: values.collection_type,
        priority: values.priority ? Number(values.priority) : 0,
        stackable: !!values.stackable,
        new_user_only: !!values.new_user_only,
        applicable_store_ids: values.applicable_store_ids || [],
        applicable_category_ids: values.applicable_category_ids || [],
        applicable_product_ids: values.applicable_product_ids || [],
        excluded_product_ids: values.excluded_product_ids || [],
        applicable_user_ids: parsedApplicableUserIds, // ✅ Đã parse đúng format
        user_conditions: parsedUserConditions,
        time_restrictions: parsedTimeRestrictions,
        theme_color: values.theme_color || '#FF6B6B',
      };

      // Submit
      if (editingVoucher) {
        await voucherApi.updateVoucher(editingVoucher.id, payload);
        message.success('Cập nhật voucher thành công!');
      } else {
        await voucherApi.createVoucher(payload);
        message.success('Tạo voucher thành công!');
      }

      setShowModal(false);
      form.resetFields();
      setEditingVoucher(null);
      fetchVouchers();
    } catch (err: any) {
      console.error('Submit voucher failed:', err);
      message.error(
        err.response?.data?.message || 'Có lỗi xảy ra khi lưu voucher'
      );
    } finally {
      setLoading(false);
    }
  };

  // Delete voucher
  const handleDelete = async (id: number) => {
    try {
      setLoading(true);
      await voucherApi.deleteVoucher(id);
      message.success('Xóa voucher thành công!');
      fetchVouchers();
    } catch (err: any) {
      console.error('Delete voucher failed:', err);
      message.error(err.response?.data?.message || 'Không thể xóa voucher');
    } finally {
      setLoading(false);
    }
  };

  // Open edit modal
  const handleEdit = (voucher: Voucher) => {
    setEditingVoucher(voucher);
    form.setFieldsValue({
      code: voucher.code,
      title: voucher.title,
      description: voucher.description,
      type: voucher.type,
      discount_type: voucher.discount_type,
      discount_value: voucher.discount_value,
      max_discount_amount: voucher.max_discount_amount,
      min_order_amount: voucher.min_order_amount,
      dateRange: [dayjs(voucher.start_date), dayjs(voucher.end_date)],
      total_usage_limit: voucher.total_usage_limit,
      per_user_limit: voucher.per_user_limit,
      collection_limit: voucher.collection_limit,
      status: voucher.status,
      collection_type: voucher.collection_type,
      priority: voucher.priority,
      stackable: voucher.stackable,
      new_user_only: voucher.new_user_only,
      applicable_store_ids: voucher.applicable_store_ids || [],
      applicable_category_ids: voucher.applicable_category_ids || [],
      applicable_product_ids: voucher.applicable_product_ids || [],
      excluded_product_ids: voucher.excluded_product_ids || [],
      applicable_user_ids: voucher.applicable_user_ids
        ? JSON.stringify(voucher.applicable_user_ids)
        : undefined,
      theme_color: voucher.theme_color,
    });
    setShowModal(true);
  };

  // Render loại voucher
  const renderTypeTag = (type: VoucherType) => {
    const typeConfig = {
      [VoucherType.SHIPPING]: { color: 'blue', text: 'Freeship' },
      [VoucherType.PRODUCT]: { color: 'purple', text: 'Sản phẩm' },
      [VoucherType.STORE]: { color: 'cyan', text: 'Cửa hàng' },
      [VoucherType.CATEGORY]: { color: 'magenta', text: 'Danh mục' },
      [VoucherType.PLATFORM]: { color: 'geekblue', text: 'Toàn sàn' },
    };
    return <Tag color={typeConfig[type]?.color}>{typeConfig[type]?.text}</Tag>;
  };

  // Render kiểu giảm giá
  const renderDiscountTypeTag = (discountType: VoucherDiscountType) => {
    const discountTypeConfig = {
      [VoucherDiscountType.PERCENTAGE]: { color: 'green', text: 'Phần trăm' },
      [VoucherDiscountType.FIXED]: { color: 'blue', text: 'Cố định' },
      [VoucherDiscountType.CASH_BACK]: { color: 'purple', text: 'Hoàn tiền' },
    };
    return (
      <Tag color={discountTypeConfig[discountType]?.color}>
        {discountTypeConfig[discountType]?.text}
      </Tag>
    );
  };

  // Render trạng thái
  const renderStatusTag = (status: VoucherStatus) => {
    switch (status) {
      case VoucherStatus.ACTIVE:
        return <Tag color="green">Đang hoạt động</Tag>;
      case VoucherStatus.DRAFT:
        return <Tag color="default">Bản nháp</Tag>;
      case VoucherStatus.PAUSED:
        return <Tag color="orange">Tạm dừng</Tag>;
      case VoucherStatus.EXPIRED:
        return <Tag color="red">Hết hạn</Tag>;
      case VoucherStatus.DEPLETED:
        return <Tag color="volcano">Đã dùng hết</Tag>;
      default:
        return <Tag>N/A</Tag>;
    }
  };

  // Cột của bảng
  const columns = [
    {
      title: 'Mã',
      dataIndex: 'code',
      key: 'code',
      width: 150,
    },
    {
      title: 'Tiêu Đề',
      dataIndex: 'title',
      key: 'title',
      width: 200,
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: VoucherType) => renderTypeTag(type),
    },
    {
      title: 'Kiểu Giảm Giá',
      dataIndex: 'discount_type',
      key: 'discount_type',
      width: 120,
      render: (discountType: VoucherDiscountType) =>
        renderDiscountTypeTag(discountType),
    },
    {
      title: 'Giá Trị Giảm',
      dataIndex: 'discount_value',
      key: 'discount_value',
      width: 140,
      render: (value: number, record: Voucher) => {
        const num = Math.round(value); // Loại bỏ .00, .000...

        if (record.discount_type === VoucherDiscountType.PERCENTAGE) {
          return <Tag color="green">{num}%</Tag>;
        }

        if (record.discount_type === VoucherDiscountType.FIXED) {
          return <Tag color="blue">{num.toLocaleString('vi-VN')}đ</Tag>;
        }

        if (record.discount_type === VoucherDiscountType.CASH_BACK) {
          return <Tag color="purple">Hoàn {num.toLocaleString('vi-VN')}đ</Tag>;
        }

        return `${num}`;
      },
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: VoucherStatus) => renderStatusTag(status),
    },
    {
      title: 'Ngày Bắt Đầu',
      dataIndex: 'start_date',
      key: 'start_date',
      width: 150,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Ngày Kết Thúc',
      dataIndex: 'end_date',
      key: 'end_date',
      width: 150,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Hành Động',
      key: 'action',
      fixed: 'right' as const,
      width: 150,
      render: (_: any, record: Voucher) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          >
            Sửa
          </Button>
          <Popconfirm
            title="Bạn có chắc muốn xóa voucher này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button icon={<DeleteOutlined />} danger size="small">
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="h-full overflow-hidden">
      {/* Thống kê */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Tổng Voucher" value={totalVouchers} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Đang Hoạt Động"
              value={activeVouchers}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Hết Hạn"
              value={expiredVouchers}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Đã Dùng Hết"
              value={depletedVouchers}
              valueStyle={{ color: '#fa541c' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Tiêu đề và tìm kiếm */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-900 m-0">Quản Lý Voucher</h3>
        <Space>
          <Input
            placeholder="Tìm mã, tiêu đề, mô tả..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            style={{ width: 220 }}
          />
          <Select
            placeholder="Lọc Trạng Thái"
            allowClear
            style={{ width: 140 }}
            value={statusFilter}
            onChange={(val:any) => setStatusFilter(val)}
          >
            <Option value={VoucherStatus.ACTIVE}>Đang hoạt động</Option>
            <Option value={VoucherStatus.DRAFT}>Bản nháp</Option>
            <Option value={VoucherStatus.PAUSED}>Tạm dừng</Option>
            <Option value={VoucherStatus.EXPIRED}>Hết hạn</Option>
            <Option value={VoucherStatus.DEPLETED}>Đã dùng hết</Option>
          </Select>
          <Select
            placeholder="Lọc Loại Voucher"
            allowClear
            style={{ width: 160 }}
            value={typeFilter}
            onChange={(val:any) => setTypeFilter(val)}
          >
            <Option value={VoucherType.SHIPPING}>Freeship (Vận chuyển)</Option>
            <Option value={VoucherType.PRODUCT}>Giảm giá sản phẩm</Option>
            <Option value={VoucherType.STORE}>Voucher cửa hàng</Option>
            <Option value={VoucherType.CATEGORY}>Voucher danh mục</Option>
            <Option value={VoucherType.PLATFORM}>Voucher toàn sàn</Option>
          </Select>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingVoucher(null);
              form.resetFields();
              setShowModal(true);
            }}
          >
            Thêm Voucher Mới
          </Button>
        </Space>
      </div>

      {/* Bảng voucher */}
      <Card size="small" styles={{ body: { padding: 20 } }}>
        <Table
          dataSource={filteredVouchers}
          columns={columns}
          rowKey="id"
          loading={loading}
          size="small"
          scroll={{ x: 1600, y: 500 }}
          pagination={{
            total: filteredVouchers.length,
            pageSize: 20,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
            showTotal: (total) => `Tổng ${total} voucher`,
          }}
        />
      </Card>

      {/* Modal Form */}
      <VoucherFormModal
        visible={showModal}
        onCancel={() => {
          setShowModal(false);
          form.resetFields();
          setEditingVoucher(null);
        }}
        onSubmit={handleSubmit}
        editingVoucher={editingVoucher}
        loading={loading}
        form={form}
        stores={stores}
        categories={categories}
        products={products}
      />
    </div>
  );
};

export default VoucherManager;
