import React, { useState } from 'react';
import {
  Layout,
  Card,
  Table,
  Typography,
  Tag,
  Input,
  Space,
  Button,
  message,
} from 'antd';
import {
  ReloadOutlined,
  SearchOutlined,
  GiftOutlined,
} from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import { useStoreSubscriptions } from '../../../hooks/useStoreSubscriptions';

const { Content } = Layout;
const { Title, Text } = Typography;

export default function StoreSubscriptionsPage() {
  const { id } = useParams<{ id: string }>();
  const storeId = Number(id);
  const { subscriptions, loading, error } = useStoreSubscriptions(storeId);

  const [searchText, setSearchText] = useState('');

  const filteredData = subscriptions.filter(
    (sub) =>
      sub.name.toLowerCase().includes(searchText.toLowerCase()) ||
      sub.user.profile.full_name
        ?.toLowerCase()
        .includes(searchText.toLowerCase())
  );

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(dateStr));
  };

  const getStatusTag = (sub: any) => {
    const today = new Date();
    const end = sub.endDate ? new Date(sub.endDate) : null;
    if (end && end < today)
      return <Tag color="gray">Hết hạn</Tag>; 
    if (sub.remainingQuantity === 0)
      return <Tag color="red">Hết lượt</Tag>;
    if (sub.remainingQuantity < sub.totalQuantity)
      return <Tag color="orange">Đang sử dụng</Tag>;
    return <Tag color="green">Còn đầy</Tag>;
  };

  const columns = [
    {
      title: 'Tên gói',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => (
        <span className="font-medium text-gray-900">{text}</span>
      ),
    },
    {
      title: 'Người dùng',
      key: 'user',
      render: (_: any, record: any) => (
        <span>{record.user?.profile?.full_name || '—'}</span>
      ),
    },
    {
      title: 'Ngày bắt đầu',
      dataIndex: 'startDate',
      key: 'startDate',
      render: (text: string) => <Text>{formatDate(text)}</Text>,
    },
    {
      title: 'Ngày kết thúc',
      dataIndex: 'endDate',
      key: 'endDate',
      render: (text: string) => <Text>{formatDate(text)}</Text>,
    },
    {
      title: 'Còn lại',
      dataIndex: 'remainingQuantity',
      key: 'remainingQuantity',
      align: 'center' as const,
      render: (value: number, record: any) => (
        <span className={value === 0 ? 'text-red-500 font-medium' : ''}>
          {value}/{record.totalQuantity}
        </span>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      align: 'center' as const,
      render: (_: any, record: any) => getStatusTag(record),
    },
  ];

  if (error) return <p style={{ color: 'red' }}>Lỗi: {error}</p>;

  return (
    <Layout>
      <Content className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Title level={2} className="!mb-1">
              Gói Dịch Vụ Của Cửa Hàng
            </Title>
            <Text type="secondary">
              Quản lý các gói đăng ký hiện tại của cửa hàng bạn
            </Text>
          </div>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => message.info('Chức năng reload đang được phát triển')}
          >
            Làm mới
          </Button>
        </div>

        <Card>
          <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
            <Input
              placeholder="Tìm kiếm theo tên gói hoặc người dùng..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="max-w-md"
            />
            <Space>
              <Button
                type="primary"
                icon={<GiftOutlined />}
                className="bg-cyan-500 border-cyan-500"
              >
                Nâng cấp gói
              </Button>
            </Space>
          </div>

          <Table
            columns={columns}
            dataSource={filteredData}
            loading={loading}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} trên tổng ${total} gói`,
            }}
          />
        </Card>
      </Content>
    </Layout>
  );
}
