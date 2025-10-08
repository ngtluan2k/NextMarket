import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  DatePicker,
  Space,
  Card,
  Statistic,
  Tag,
  Row,
  Col,
  message,
  Switch,
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
import {
  VoucherType,
  VoucherDiscountType,
  VoucherStatus,
  VoucherCollectionType,
  type Voucher,
  type CreateVoucherPayload,
} from '../../types/voucher';

const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

const VoucherManager: React.FC = () => {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [filteredVouchers, setFilteredVouchers] = useState<Voucher[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<VoucherStatus | null>(null);
  const [typeFilter, setTypeFilter] = useState<VoucherType | null>(null);
  const [form] = Form.useForm();

  // Statistics
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

      const payload: CreateVoucherPayload = {
        code: values.code.trim().toUpperCase(),
        title: values.title,
        description: values.description,
        type: values.type,
        discount_type: values.discount_type,
        discount_value: Number(values.discount_value) || 0, // ✔ convert sang number
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
        applicable_store_ids: values.applicable_store_ids,
        theme_color: values.theme_color || '#FF6B6B',
      };

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
      message.error(err.response?.data?.message || 'Có lỗi xảy ra');
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
      applicable_store_ids: voucher.applicable_store_ids,
      theme_color: voucher.theme_color,
    });
    setShowModal(true);
  };

  // Render status tag
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

  // Render type tag
  const renderTypeTag = (type: VoucherType) => {
    const types = {
      [VoucherType.SHIPPING]: { text: 'Vận chuyển', color: 'blue' },
      [VoucherType.PRODUCT]: { text: 'Sản phẩm', color: 'cyan' },
      [VoucherType.STORE]: { text: 'Cửa hàng', color: 'purple' },
      [VoucherType.CATEGORY]: { text: 'Danh mục', color: 'geekblue' },
      [VoucherType.PLATFORM]: { text: 'Nền tảng', color: 'magenta' },
    };
    const t = types[type];
    return <Tag color={t.color}>{t.text}</Tag>;
  };

  // Table columns
  const columns = [
    {
      title: 'Mã',
      dataIndex: 'code',
      key: 'code',
      width: 120,
      fixed: 'left' as const,
    },
    {
      title: 'Tiêu đề',
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
      title: 'Giảm giá',
      key: 'discount',
      width: 150,
      render: (record: Voucher) => {
        if (record.discount_type === VoucherDiscountType.PERCENTAGE) {
          return `${record.discount_value}%`;
        } else {
          return `${record.discount_value.toLocaleString()} VND`;
        }
      },
    },
    {
      title: 'Đã dùng',
      key: 'usage',
      width: 100,
      render: (record: Voucher) =>
        `${record.total_used_count}${
          record.total_usage_limit ? `/${record.total_usage_limit}` : ''
        }`,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: VoucherStatus) => renderStatusTag(status),
    },
    {
      title: 'Kết hợp',
      dataIndex: 'stackable',
      key: 'stackable',
      width: 90,
      render: (stackable: boolean) => (stackable ? '✓' : '✗'),
    },
    {
      title: 'Ngày bắt đầu',
      dataIndex: 'start_date',
      key: 'start_date',
      width: 110,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Ngày kết thúc',
      dataIndex: 'end_date',
      key: 'end_date',
      width: 110,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 100,
      fixed: 'right' as const,
      render: (record: Voucher) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Bạn có chắc muốn xóa voucher này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button type="text" danger icon={<DeleteOutlined />} size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="h-full overflow-hidden">
      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Tổng voucher" value={totalVouchers} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Đang hoạt động"
              value={activeVouchers}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Hết hạn"
              value={expiredVouchers}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Đã dùng hết"
              value={depletedVouchers}
              valueStyle={{ color: '#fa541c' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-900 m-0">Quản lý Voucher</h3>
        <Space>
          <Input
            placeholder="Tìm kiếm mã, tiêu đề"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            style={{ width: 220 }}
          />

          <Select
            placeholder="Trạng thái"
            allowClear
            style={{ width: 140 }}
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
          >
            <Option value={VoucherStatus.ACTIVE}>Đang hoạt động</Option>
            <Option value={VoucherStatus.DRAFT}>Bản nháp</Option>
            <Option value={VoucherStatus.PAUSED}>Tạm dừng</Option>
            <Option value={VoucherStatus.EXPIRED}>Hết hạn</Option>
            <Option value={VoucherStatus.DEPLETED}>Đã dùng hết</Option>
          </Select>

          <Select
            placeholder="Loại voucher"
            allowClear
            style={{ width: 140 }}
            value={typeFilter}
            onChange={(val) => setTypeFilter(val)}
          >
            <Option value={VoucherType.SHIPPING}>Vận chuyển</Option>
            <Option value={VoucherType.PRODUCT}>Sản phẩm</Option>
            <Option value={VoucherType.STORE}>Cửa hàng</Option>
            <Option value={VoucherType.CATEGORY}>Danh mục</Option>
            <Option value={VoucherType.PLATFORM}>Nền tảng</Option>
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
            Thêm Voucher
          </Button>
        </Space>
      </div>

      {/* Table */}
      <Card size="small" styles={{ body: { padding: 20 } }}>
        <Table
          dataSource={filteredVouchers}
          columns={columns}
          rowKey="id"
          loading={loading}
          size="small"
          scroll={{ x: 1500 }}
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
      <Modal
        title={editingVoucher ? 'Chỉnh sửa Voucher' : 'Thêm Voucher mới'}
        open={showModal}
        onCancel={() => {
          setShowModal(false);
          form.resetFields();
          setEditingVoucher(null);
        }}
        onOk={handleSubmit}
        width={800}
        confirmLoading={loading}
        okText={editingVoucher ? 'Cập nhật' : 'Tạo mới'}
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Mã Voucher"
                name="code"
                rules={[
                  { required: true, message: 'Vui lòng nhập mã voucher' },
                ]}
              >
                <Input placeholder="VD: DISCOUNT20" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Tiêu đề"
                name="title"
                rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
              >
                <Input placeholder="Giảm giá 20%" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Mô tả" name="description">
            <TextArea rows={2} placeholder="Mô tả chi tiết về voucher" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Loại voucher"
                name="type"
                initialValue={VoucherType.PRODUCT}
                rules={[{ required: true, message: 'Chọn loại voucher' }]}
              >
                <Select>
                  <Option value={VoucherType.SHIPPING}>Vận chuyển</Option>
                  <Option value={VoucherType.PRODUCT}>Sản phẩm</Option>
                  <Option value={VoucherType.STORE}>Cửa hàng</Option>
                  <Option value={VoucherType.CATEGORY}>Danh mục</Option>
                  <Option value={VoucherType.PLATFORM}>Nền tảng</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Kiểu giảm giá"
                name="discount_type"
                rules={[{ required: true, message: 'Chọn kiểu giảm giá' }]}
                initialValue={VoucherDiscountType.PERCENTAGE}
              >
                <Select>
                  <Option value={VoucherDiscountType.PERCENTAGE}>
                    Phần trăm
                  </Option>
                  <Option value={VoucherDiscountType.FIXED}>Cố định</Option>
                  <Option value={VoucherDiscountType.CASH_BACK}>
                    Hoàn tiền
                  </Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Giá trị giảm"
                name="discount_value"
                rules={[{ required: true, message: 'Nhập giá trị' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  placeholder="VD: 20"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Giảm tối đa (VND)" name="max_discount_amount">
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                  }
                  placeholder="VD: 100000"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Đơn hàng tối thiểu (VND)"
                name="min_order_amount"
                initialValue={0}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                  }
                  placeholder="VD: 50000"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label="Thời gian hiệu lực"
                name="dateRange"
                rules={[{ required: true, message: 'Chọn thời gian' }]}
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
              <Form.Item label="Tổng lượt dùng" name="total_usage_limit">
                <InputNumber
                  style={{ width: '100%' }}
                  min={1}
                  placeholder="Không giới hạn"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Lượt dùng/người"
                name="per_user_limit"
                initialValue={1}
                rules={[{ required: true, message: 'Nhập lượt dùng' }]}
              >
                <InputNumber style={{ width: '100%' }} min={1} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Giới hạn lượt lưu" name="collection_limit">
                <InputNumber
                  style={{ width: '100%' }}
                  min={1}
                  placeholder="Không giới hạn"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Trạng thái"
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
                label="Kiểu nhận voucher"
                name="collection_type"
                initialValue={VoucherCollectionType.AUTO}
                rules={[{ required: true, message: 'Chọn kiểu nhận' }]}
              >
                <Select>
                  <Option value={VoucherCollectionType.AUTO}>Tự động</Option>
                  <Option value={VoucherCollectionType.MANUAL}>Thủ công</Option>
                  <Option value={VoucherCollectionType.TARGETED}>
                    Định hướng
                  </Option>
                  <Option value={VoucherCollectionType.EVENT}>Sự kiện</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Độ ưu tiên" name="priority" initialValue={0}>
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Cho phép kết hợp"
                name="stackable"
                valuePropName="checked"
                initialValue={false}
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Chỉ người dùng mới"
                name="new_user_only"
                valuePropName="checked"
                initialValue={false}
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Màu chủ đề"
            name="theme_color"
            initialValue="#FF6B6B"
          >
            <Input type="color" style={{ width: 100 }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default VoucherManager;
