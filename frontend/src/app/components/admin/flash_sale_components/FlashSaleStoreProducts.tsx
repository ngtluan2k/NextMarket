import React, { useEffect, useState } from 'react';
import { Table, Card, message, Button, Space, Tag, Dropdown, Menu } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import { getRegisteredProductsForAdmin } from '../../../../service/flash_sale.service';
import { MoreOutlined } from '@ant-design/icons';


dayjs.locale('vi');

export interface RegisteredProduct {
  id: number;
  product_id: number;
  product_name: string;
  variant_id?: number;
  variant_name?: string;
  original_price?: number;
  price: number;
  limit_quantity?: number;
  store: {
    id: number;
    name: string;
  };
  status: 'pending' | 'approved' | 'rejected';
}

interface Props {
  scheduleId: number;
  scheduleStartsAt: string; // thời gian bắt đầu Flash Sale
  scheduleEndsAt: string; // thời gian kết thúc Flash Sale
  storeId?: number; // nếu muốn filter theo store
  onBack: () => void;
}

const FlashSaleStoreProducts: React.FC<Props> = ({
  scheduleId,
  scheduleStartsAt,
  scheduleEndsAt,
  storeId,
  onBack,
}) => {
  const [products, setProducts] = useState<RegisteredProduct[]>([]);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem('token') || '';

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data: RegisteredProduct[] = await getRegisteredProductsForAdmin(
        scheduleId,
        token
      );
      const list = storeId ? data.filter((p) => p.store.id === storeId) : data;
      setProducts(list);
      console.log(list);
    } catch (err: any) {
      console.error(err);
      message.error('Lỗi lấy danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [scheduleId, storeId]);

  const renderStatusTag = (status: string) => {
    switch (status) {
      case 'pending':
        return <Tag color="blue">Chờ duyệt</Tag>;
      case 'approved':
        return <Tag color="green">Đã duyệt</Tag>;
      case 'rejected':
        return <Tag color="red">Từ chối</Tag>;
      default:
        return <Tag color="green">Đã đăng ký</Tag>;
    }
  };

  const columns: ColumnsType<RegisteredProduct> = [
    { title: 'Tên sản phẩm', dataIndex: 'product_name', key: 'product_name' },
    {
      title: 'Loại',
      dataIndex: 'variant_name',
      key: 'variant_name',
      render: (v) => v || '-',
    },
    { title: 'Cửa hàng', key: 'store', render: (_, r) => r.store.name },
    {
      title: 'Giá gốc',
      dataIndex: 'original_price',
      key: 'original_price',
      render: (v: number) => new Intl.NumberFormat('vi-VN').format(v), // 100.000
    },
    {
      title: 'Giá',
      dataIndex: 'price',
      key: 'price',
      render: (v: number) => new Intl.NumberFormat('vi-VN').format(v), // 100.000
    },
    {
      title: 'Giới hạn',
      dataIndex: 'limit_quantity',
      key: 'limit_quantity',
      render: (v) =>
        v != null ? new Intl.NumberFormat('vi-VN').format(v) : '-', // 1.000
    },

    {
      title: 'Thời gian',
      key: 'time',
      render: () =>
        `${dayjs(scheduleStartsAt).format('DD/MM/YYYY HH:mm')} - ${dayjs(
          scheduleEndsAt
        ).format('DD/MM/YYYY HH:mm')}`,
    },
   {
  title: 'Hành động',
  key: 'actions',
  align: 'center' as const,
  render: (_: any, record: RegisteredProduct) => {
    const menu = (
      <Menu
        // onClick={({ key }) => {
        //   if (key === 'detail') handleViewDetail(record);
        //   if (key === 'remove') handleRemoveFromFlashSale(record);
        // }}
        items={[
          { key: 'detail', label: 'Xem chi tiết' },
          { key: 'remove', label: 'Gỡ khỏi Flash Sale', danger: true },
        ]}
      />
    );

    return (
      <Dropdown overlay={menu} trigger={['click']} placement="bottomRight">
        <Button type="text" icon={<MoreOutlined />} />
      </Dropdown>
    );
  },
}

  ];

  return (
    <div style={{ height: '100%', overflow: 'hidden' }}>
      <Space style={{ marginBottom: 16 }}>
        <Button onClick={onBack}>← Quay lại Flash Sale</Button>
        <h3 className="text-xl font-bold text-gray-900 m-0">
          Sản phẩm tham gia Flash Sale
        </h3>
      </Space>

      <Card size="small">
        <Table
          dataSource={products}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />
      </Card>
    </div>
  );
};

export default FlashSaleStoreProducts;
