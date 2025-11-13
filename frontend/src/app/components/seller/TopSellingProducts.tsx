'use client';
import { Card, Table, Typography, Spin } from 'antd';
import { MoreOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { productService } from '../../../service/product.service';

const { Title, Text } = Typography;

interface TopSellingProductsProps {
  storeId: number;
  days?: number; // nhận từ cha
}

export default function TopSellingProducts({
  storeId,
  days = 7,
}: TopSellingProductsProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days + 1);

      const data = await productService.getStoreProducts(
        storeId,
        startDate.toISOString(),
        endDate.toISOString()
      );

      const topProducts = data
        .filter((p) => (p.sold || 0) > 0) // chỉ lấy sản phẩm có bán
        .sort((a, b) => (b.sold || 0) - (a.sold || 0)) // sắp xếp giảm dần
        .slice(0, 5); // lấy 5 sản phẩm đầu

      setProducts(topProducts);

      console.log('Top sản phẩm bán chạy:', topProducts);
    } catch (error) {
      console.error('Lỗi khi lấy sản phẩm:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [storeId, days]);

  const columns = [
    {
      title: 'Sản Phẩm',
      dataIndex: 'name',
      key: 'product',
      render: (text: string, record: any) => (
        <div className="flex items-center gap-3">
          <img
            src={record.image || '/placeholder.svg'}
            alt={text}
            className="w-10 h-10 rounded-lg object-cover"
          />
          <div>
            <div className="font-medium text-gray-900">{text}</div>
            <div className="text-sm text-gray-500">{record.id}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Giá',
      dataIndex: 'base_price',
      key: 'base_price',
      render: (base_price: any) =>
        new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND',
        }).format(Number(base_price) || 0),
    },
    {
      title: 'Số Lượng Bán',
      dataIndex: 'sold',
      key: 'itemsSold',
    },
    {
      title: 'Doanh Thu',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (revenue: number) =>
        new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND',
        }).format(revenue),
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let text = '';
        let bgColor = '';
        let textColor = '';

        switch (status) {
          case 'active':
            text = 'Đang hoạt động';
            bgColor = 'bg-green-100';
            textColor = 'text-green-800';
            break;
          case 'draft':
            text = 'Bản nháp';
            bgColor = 'bg-yellow-100';
            textColor = 'text-yellow-800';
            break;
          case 'deleted':
            text = 'Đã xóa';
            bgColor = 'bg-red-100';
            textColor = 'text-red-800';
            break;
          default:
            text = status;
            bgColor = 'bg-gray-100';
            textColor = 'text-gray-800';
            break;
        }

        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor}`}
          >
            {text}
          </span>
        );
      },
    },
    {
      title: '',
      key: 'action',
      render: () => <MoreOutlined className="text-gray-400 cursor-pointer" />,
    },
  ];

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div>
          <Title level={4} className="!mb-1">
            Sản Phẩm Bán Chạy Nhất
          </Title>
          <Text className="text-cyan-500 cursor-pointer">
            Xem danh sách đầy đủ
          </Text>
        </div>
        <Text className="text-gray-400 text-sm">Dữ liệu {days} ngày qua</Text>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <Spin tip="Đang tải dữ liệu..." />
        </div>
      ) : (
        <Table
          columns={columns}
          dataSource={products}
          pagination={false}
          rowKey="id"
        />
      )}
    </Card>
  );
}
