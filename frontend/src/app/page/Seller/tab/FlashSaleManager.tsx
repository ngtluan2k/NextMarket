import React, { useEffect, useState } from 'react';
import { Table, Button, Card, Tag, Space, message, Dropdown, Menu } from 'antd';
import { PlusOutlined, ReloadOutlined, MoreOutlined } from '@ant-design/icons';
import { getAllFlashSalesForStore } from '../../../../service/flash_sale.service';

interface FlashSale {
  id: number;
  name: string;
  description?: string;
  starts_at: string;
  ends_at: string;
  status: 'upcoming' | 'active' | 'ended';
}

interface FlashSaleManagerProps {
  onSelectFlashSale: (id: number) => void;
}

const FlashSaleManager: React.FC<FlashSaleManagerProps> = ({
  onSelectFlashSale,
}) => {
  const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFlashSales = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Token not found');
      const data = await getAllFlashSalesForStore(token);
      setFlashSales(Array.isArray(data?.data) ? data.data : []);
      console.log(data); // 👈 tránh lỗi filter is not a function
    } catch (err: any) {
      console.error(err);
      message.error('Không thể tải danh sách Flash Sale');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlashSales();
  }, []);

  const columns = [
    {
      title: 'Tên chương trình',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Thời gian bắt đầu',
      dataIndex: 'starts_at',
      key: 'starts_at',
      render: (v: string) => new Date(v).toLocaleString(),
    },
    {
      title: 'Thời gian kết thúc',
      dataIndex: 'ends_at',
      key: 'ends_at',
      render: (v: string) => new Date(v).toLocaleString(),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'default';
        let label = '';

        switch (status) {
          case 'active':
            color = 'green';
            label = 'Đang diễn ra';
            break;
          case 'upcoming':
            color = 'blue';
            label = 'Sắp diễn ra';
            break;
          case 'ended':
            color = 'red';
            label = 'Đã kết thúc';
            break;
          default:
            label = 'Không xác định';
        }

        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: FlashSale) => {
        const menu = (
          <Menu>
            <Menu.Item
              key="register"
              disabled={record.status === 'ended'}
              onClick={() => onSelectFlashSale(record.id)}
            >
              Đăng ký
            </Menu.Item>
            <Menu.Item
              key="detail" /*onClick={() => handleViewDetail(record.id)}*/
            >
              Xem chi tiết
            </Menu.Item>
          </Menu>
        );

        return (
          <Dropdown overlay={menu} placement="bottomRight" trigger={['click']}>
            <Button icon={<MoreOutlined />} />
          </Dropdown>
        );
      },
    },
  ];

  return (
    <Card
      title="⚡ Quản lý Flash Sale"
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchFlashSales}>
            Tải lại
          </Button>
          <Button type="primary" icon={<PlusOutlined />}>
            Thêm Flash Sale
          </Button>
        </Space>
      }
    >
      <Table
        columns={columns}
        dataSource={flashSales}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
    </Card>
  );
};

export default FlashSaleManager;
