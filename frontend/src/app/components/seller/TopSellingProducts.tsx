'use client';
import { Card, Table, Typography } from 'antd';
import { MoreOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const productData = [
  {
    key: '1',
    product: 'Áo thun Nike cơ bản',
    id: 'ID #12345',
    price: '355000 ₫',
    itemsSold: 68,
    revenue: '24150600 ₫',
    status: 'Còn hàng',
    image: '/athletic-tshirt.png',
  },
  {
    key: '2',
    product: 'Quần Jeans slim fit',
    id: 'ID #45325',
    price: '527800 ₫',
    itemsSold: 56,
    revenue: '29556800 ₫',
    status: 'Còn 8 sản phẩm',
    image: '/placeholder-d8hyd.png',
  },
  {
    key: '3',
    product: 'Giày New Balance 327',
    id: 'ID #12345',
    price: '1193700 ₫',
    itemsSold: 43,
    revenue: '51329100 ₫',
    status: 'Còn hàng',
    image: '/placeholder-lherd.png',
  },
];

export default function TopSellingProducts() {
  const columns = [
    {
      title: 'Sản Phẩm',
      dataIndex: 'product',
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
      dataIndex: 'price',
      key: 'price',
      className: 'text-gray-600',
    },
    {
      title: 'Số Lượng Bán',
      dataIndex: 'itemsSold',
      key: 'itemsSold',
      className: 'text-gray-600',
    },
    {
      title: 'Doanh Thu',
      dataIndex: 'revenue',
      key: 'revenue',
      className: 'text-gray-600',
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            status === 'Còn hàng'
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          {status}
        </span>
      ),
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
          <Text className="text-cyan-500 cursor-pointer">Xem danh sách đầy đủ</Text>
        </div>
        <Text className="text-gray-400 text-sm">Theo số lượng bán</Text>
      </div>
      <Table
        columns={columns}
        dataSource={productData}
        pagination={false}
        className="custom-table"
      />
    </Card>
  );
}