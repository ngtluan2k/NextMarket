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
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  SearchOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';

const { Option } = Select;

interface Voucher {
  id: number;
  uuid: string;
  code: string;
  description?: string;
  discount_type: string;
  discount_value: number;
  min_order_amount?: number;
  start_date: string;
  end_date: string;
  usage_limit?: number;
  used_count: number;
  created_at: string;
}

const VoucherManager: React.FC = () => {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [filteredVouchers, setFilteredVouchers] = useState<Voucher[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [form] = Form.useForm();

  const token = localStorage.getItem('token');

  // ==== Statistics ====
  const totalVouchers = vouchers.length;
  const activeVouchers = vouchers.filter(
    (v) => new Date(v.end_date) >= new Date()
  ).length;
  const expiredVouchers = vouchers.filter(
    (v) => new Date(v.end_date) < new Date()
  ).length;
  const fullyUsedVouchers = vouchers.filter(
    (v) => v.usage_limit && v.used_count >= v.usage_limit
  ).length;

  useEffect(() => {
    fetchVouchers();
  }, []);

  useEffect(() => {
    handleFilterAndSearch();
  }, [vouchers, searchText, statusFilter, typeFilter]);

  // ==== API Configuration ====
  const apiClient = axios.create({
    baseURL: 'http://localhost:3000',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
      const errorMessage =
        error.response?.data?.message || error.message || 'Đã xảy ra lỗi';
      message.error(errorMessage);
      return Promise.reject(error);
    }
  );

  // ==== API Calls ====
  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/vouchers');
      const voucherData = Array.isArray(res.data) ? res.data : [];
      setVouchers(voucherData);
    } catch (err) {
      console.error('Fetch vouchers failed:', err);
      setVouchers([]);
    } finally {
      setLoading(false);
    }
  };

  // ==== Helpers ====
  const getStatus = (voucher: Voucher): string => {
    const now = new Date();
    if (voucher.usage_limit && voucher.used_count >= voucher.usage_limit) {
      return 'used_up';
    }
    if (new Date(voucher.end_date) < now) {
      return 'expired';
    }
    if (new Date(voucher.start_date) > now) {
      return 'upcoming';
    }
    return 'active';
  };

  const renderStatusTag = (voucher: Voucher) => {
    const status = getStatus(voucher);
    switch (status) {
      case 'used_up':
        return <Tag color="red">Đã dùng hết</Tag>;
      case 'expired':
        return <Tag color="volcano">Hết hạn</Tag>;
      case 'upcoming':
        return <Tag color="blue">Chưa bắt đầu</Tag>;
      default:
        return <Tag color="green">Đang hoạt động</Tag>;
    }
  };

  const handleFilterAndSearch = () => {
    let data = [...vouchers];

    if (searchText.trim()) {
      data = data.filter(
        (v) =>
          v.code.toLowerCase().includes(searchText.toLowerCase()) ||
          (v.description &&
            v.description.toLowerCase().includes(searchText.toLowerCase()))
      );
    }

    if (statusFilter) {
      data = data.filter((v) => getStatus(v) === statusFilter);
    }

    if (typeFilter) {
      data = data.filter((v) => v.discount_type === typeFilter);
    }

    setFilteredVouchers(data);
  };

  // ==== Table Columns ====
  const columns = [
    {
      title: 'Mã',
      dataIndex: 'code',
      key: 'code',
      width: 120,
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      width: 200,
      render: (text: string) => text || 'N/A',
    },
    {
      title: 'Loại giảm giá',
      dataIndex: 'discount_type',
      key: 'discount_type',
      width: 120,
      render: (type: string) =>
        type === 'percentage' ? 'Phần trăm' : 'Cố định',
    },
    {
      title: 'Giá trị',
      dataIndex: 'discount_value',
      key: 'discount_value',
      width: 100,
      render: (value: number, record: Voucher) =>
        record.discount_type === 'percentage'
          ? `${value}%`
          : `${value.toLocaleString()} VND`,
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 120,
      render: (record: Voucher) => renderStatusTag(record),
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
            onClick={() => console.log('Edit', record)}
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => console.log('Delete', record)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="h-full overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-900 m-0">Quản lý Voucher</h3>
        <Space>
          {/* Search */}
          <Input
            placeholder="Tìm kiếm mã hoặc mô tả"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            style={{ width: 220 }}
          />

          {/* Filter status */}
          <Select
            placeholder="Lọc theo trạng thái"
            allowClear
            style={{ width: 160 }}
            value={statusFilter || undefined}
            onChange={(val: string) => setStatusFilter(val || null)}
          >
            <Option value="active">Đang hoạt động</Option>
            <Option value="upcoming">Chưa bắt đầu</Option>
            <Option value="expired">Hết hạn</Option>
            <Option value="used_up">Đã dùng hết</Option>
          </Select>

          {/* Filter type */}
          <Select
            placeholder="Loại giảm giá"
            allowClear
            style={{ width: 140 }}
            value={typeFilter || undefined}
            onChange={(val: string) => setTypeFilter(val || null)}
          >
            <Option value="percentage">Phần trăm</Option>
            <Option value="fixed">Cố định</Option>
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

      {/* Voucher Table */}
      <Card size="small" bodyStyle={{ padding: '12px' }}>
        <Table
          dataSource={filteredVouchers}
          columns={columns}
          rowKey="id"
          loading={loading}
          size="small"
          pagination={{
            total: filteredVouchers.length,
            pageSize: 20,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
          }}
        />
      </Card>
    </div>
  );
};

export default VoucherManager;
