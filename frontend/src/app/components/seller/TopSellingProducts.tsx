'use client';
import { Card, Table, Typography } from 'antd';
import { MoreOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const productData = [
  {
    key: '1',
    product: 'Nike T-shirt basic',
    id: 'ID #12345',
    price: '15.45 €',
    itemsSold: 68,
    revenue: '1050.6 €',
    status: 'In stock',
    image: '/athletic-tshirt.png',
  },
  {
    key: '2',
    product: 'Mom Jeans slim fit',
    id: 'ID #45325',
    price: '22.96 €',
    itemsSold: 56,
    revenue: '1286.6 €',
    status: 'Last 8 items',
    image: '/placeholder-d8hyd.png',
  },
  {
    key: '3',
    product: 'New Balance 327',
    id: 'ID #12345',
    price: '51.90 €',
    itemsSold: 43,
    revenue: '2235.0 €',
    status: 'In stock',
    image: '/placeholder-lherd.png',
  },
];

export default function TopSellingProducts() {
  const columns = [
    {
      title: 'Product',
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
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      className: 'text-gray-600',
    },
    {
      title: 'Item Sold',
      dataIndex: 'itemsSold',
      key: 'itemsSold',
      className: 'text-gray-600',
    },
    {
      title: 'Revenue',
      dataIndex: 'revenue',
      key: 'revenue',
      className: 'text-gray-600',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            status === 'In stock'
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
            Top Selling Products
          </Title>
          <Text className="text-cyan-500 cursor-pointer">View full list</Text>
        </div>
        <Text className="text-gray-400 text-sm">By item sold</Text>
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
