'use client';
import { useState, useEffect, useMemo } from 'react';
import {
  Layout,
  Card,
  Table,
  Typography,
  Button,
  Space,
  Input,
  Select,
  Tag,
  Avatar,
} from 'antd';
import { UserOutlined, PlusOutlined, SearchOutlined, PhoneOutlined, MailOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { orderService } from '../../../../service/order.service';
import { storeService } from '../../../../service/store.service';

const { Content } = Layout;
const { Title, Text } = Typography;

export default function CustomerFromOrders() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [storeId, setStoreId] = useState<number | null>(null);
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const BASE_URL = import.meta.env.VITE_BE_BASE_URL || 'http://localhost:3000';

  // Lấy storeId khi mount
  useEffect(() => {
    const fetchStore = async () => {
      try {
        const store = await storeService.getMyStore();
        if (store?.id) setStoreId(store.id);
        else console.error('Không tìm thấy cửa hàng của bạn.');
      } catch (err) {
        console.error('Lỗi khi lấy store:', err);
      }
    };
    fetchStore();
  }, []);

  // Lấy sales khi có storeId
useEffect(() => {
  if (!storeId) return;
  setLoading(true);
  orderService.getCustomersFromOrders(storeId)
    .then(res => {
      setCustomers(Array.isArray(res.data) ? res.data : []);
    })
    .catch(err => {
      console.error(err);
      setCustomers([]);
    })
    .finally(() => setLoading(false));
}, [storeId]);


  // Map sales -> khách hàng duy nhất
  

  // Filter theo status và search
const filteredCustomers = useMemo(() => {
  return customers.filter(c => {
    const matchesStatus = statusFilter === 'all' || (c.status || '').toLowerCase() === statusFilter;
    const matchesSearch =
      !searchText ||
      (c.name || '').toLowerCase().includes(searchText.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(searchText.toLowerCase()) ||
      (c.phone || '').includes(searchText) ||
      String(c.id).includes(searchText);
    return matchesStatus && matchesSearch;
  });
}, [customers, statusFilter, searchText]);


  // Table columns
  const columns = [
    {
      title: 'Khách Hàng',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <div className="flex items-center gap-3">
          <Avatar
            src={record.avatar ? `${BASE_URL}${record.avatar}` : undefined}
            icon={!record.avatar ? <UserOutlined /> : undefined}
            size={40}
          />
          <div>
            <div className="font-medium">{text}</div>
            <div className="text-sm text-gray-500">{record.id}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Liên Hệ',
      key: 'contact',
      render: (_: any, record: any) => (
        <div className="flex flex-col">
          <span><MailOutlined />{' '}{record.email}</span>
          <span><PhoneOutlined />{' '}{record.phone}</span>
        </div>
      ),
    },
    { title: 'Đơn Hàng', dataIndex: 'totalOrders', key: 'totalOrders' },
    {
      title: 'Tổng Chi Tiêu',
      dataIndex: 'totalSpent',
      key: 'totalSpent',
      render: (amount: number) => `₫${amount.toLocaleString('vi-VN')}`,
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const normalized = status.toLowerCase();
        let color = 'red';
        if (normalized === 'vip') color = 'gold';
        else if (normalized === 'hoạt động' || normalized === 'active')
          color = 'green';
        const label = normalized === 'active' ? 'Hoạt Động' : status;
        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: 'Ngày Tham Gia',
      dataIndex: 'joinDate',
      key: 'joinDate',
      render: (date: string) => dayjs(date).format('DD MMM, YYYY'),
    },
    {
      title: 'Đơn Hàng Gần Nhất',
      dataIndex: 'lastOrderDate',
      key: 'lastOrderDate',
      render: (date: string) =>
        date ? dayjs(date).format('DD MMM, YYYY') : 'Chưa có',
    },
  ];

  return (
    <Layout>
      <Content className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Title level={2}>Quản Lý Khách Hàng</Title>
            <Text>Danh sách khách hàng từ đơn hàng của cửa hàng</Text>
          </div>
          <Space>
            <Button icon={<PlusOutlined />}>Thêm Khách Hàng</Button>
          </Space>
        </div>

        <Card className="mb-6">
          <Space wrap>
            <Select
              placeholder="Trạng Thái"
              style={{ width: 150 }}
              value={statusFilter}
              onChange={setStatusFilter}
            >
              <Select.Option value="all">Tất Cả</Select.Option>
              <Select.Option value="active">Hoạt Động</Select.Option>
              <Select.Option value="inactive">Ngừng Hoạt Động</Select.Option>
            </Select>
            <Input
              placeholder="Tìm kiếm..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 250 }}
            />
          </Space>
        </Card>

        <Card>
          <Table
            columns={columns}
            dataSource={filteredCustomers}
            loading={loading}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </Card>
      </Content>
    </Layout>
  );
}
