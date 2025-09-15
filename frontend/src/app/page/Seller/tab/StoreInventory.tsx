import { useState } from 'react';
import type React from 'react';

import {
  Layout,
  Input,
  Button,
  Select,
  Card,
  Table,
  Typography,
  Space,
  Tag,
  Dropdown,
  Modal,
  Form,
  InputNumber,
  Statistic,
} from 'antd';
import {
  SearchOutlined,
  ShoppingOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  EyeOutlined,
  CopyOutlined,
  ExportOutlined,
  ImportOutlined,
  AlertOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Content } = Layout;
const { Title, Text } = Typography;

interface Product {
  key: string;
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  sold: number;
  revenue: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  image: string;
  sku: string;
  description: string;
  tags: string[];
  createdAt: string;
}

const sampleProducts: Product[] = [
  {
    key: '1',
    id: 'PRD001',
    name: 'Nike T-shirt Basic',
    category: 'T-Shirts',
    price: 15.45,
    stock: 245,
    sold: 68,
    revenue: 1050.6,
    status: 'In Stock',
    image: '/athletic-tshirt.png',
    sku: 'NK-TSH-001',
    description: 'Comfortable cotton t-shirt perfect for everyday wear',
    tags: ['Cotton', 'Casual', 'Unisex'],
    createdAt: '2024-01-15',
  },
  {
    key: '2',
    id: 'PRD002',
    name: 'Mom Jeans Slim Fit',
    category: 'Jeans',
    price: 22.96,
    stock: 8,
    sold: 56,
    revenue: 1286.6,
    status: 'Low Stock',
    image: '/placeholder-d8hyd.png',
    sku: 'MJ-SLM-002',
    description: 'High-waisted mom jeans with a comfortable slim fit',
    tags: ['Denim', 'High-waist', 'Women'],
    createdAt: '2024-01-10',
  },
  {
    key: '3',
    id: 'PRD003',
    name: 'New Balance 327',
    category: 'Shoes',
    price: 51.9,
    stock: 0,
    sold: 43,
    revenue: 2235.0,
    status: 'Out of Stock',
    image: '/placeholder-lherd.png',
    sku: 'NB-327-003',
    description: 'Retro-inspired sneakers with modern comfort technology',
    tags: ['Sneakers', 'Retro', 'Unisex'],
    createdAt: '2024-01-05',
  },
  {
    key: '4',
    id: 'PRD004',
    name: 'Oversized Hoodie',
    category: 'Hoodies',
    price: 35.99,
    stock: 156,
    sold: 89,
    revenue: 3203.11,
    status: 'In Stock',
    image: '/placeholder-d8hyd.png',
    sku: 'OH-OVR-004',
    description: 'Cozy oversized hoodie perfect for layering',
    tags: ['Cotton', 'Oversized', 'Unisex'],
    createdAt: '2024-01-20',
  },
  {
    key: '5',
    id: 'PRD005',
    name: 'Summer Dress',
    category: 'Dresses',
    price: 28.5,
    stock: 3,
    sold: 34,
    revenue: 969.0,
    status: 'Low Stock',
    image: '/placeholder-lherd.png',
    sku: 'SD-SUM-005',
    description: 'Light and airy summer dress in floral print',
    tags: ['Floral', 'Summer', 'Women'],
    createdAt: '2024-01-12',
  },
];

export default function StoreInventory() {
  const [products, setProducts] = useState<Product[]>(sampleProducts);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [form] = Form.useForm();

  // Filter products based on search and filters
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchText.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchText.toLowerCase());
    const matchesCategory =
      categoryFilter === 'all' || product.category === categoryFilter;
    const matchesStatus =
      statusFilter === 'all' || product.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Calculate inventory stats
  const totalProducts = products.length;
  const inStock = products.filter((p) => p.status === 'In Stock').length;
  const lowStock = products.filter((p) => p.status === 'Low Stock').length;
  const outOfStock = products.filter((p) => p.status === 'Out of Stock').length;
  const totalValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);

  const handleAddProduct = () => {
    setEditingProduct(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    form.setFieldsValue(product);
    setIsModalVisible(true);
  };

  const handleDeleteProduct = (productId: string) => {
    Modal.confirm({
      title: 'Delete Product',
      content: 'Are you sure you want to delete this product?',
      okText: 'Delete',
      okType: 'danger',
      onOk: () => {
        setProducts(products.filter((p) => p.id !== productId));
      },
    });
  };

  const handleModalOk = () => {
    form.validateFields().then((values) => {
      if (editingProduct) {
        // Update existing product
        setProducts(
          products.map((p) =>
            p.id === editingProduct.id
              ? { ...p, ...values, status: getStockStatus(values.stock) }
              : p
          )
        );
      } else {
        // Add new product
        const newProduct: Product = {
          ...values,
          key: Date.now().toString(),
          id: `PRD${String(products.length + 1).padStart(3, '0')}`,
          sold: 0,
          revenue: 0,
          status: getStockStatus(values.stock),
          createdAt: new Date().toISOString().split('T')[0],
          tags: values.tags || [],
        };
        setProducts([...products, newProduct]);
      }
      setIsModalVisible(false);
      form.resetFields();
    });
  };

  const getStockStatus = (
    stock: number
  ): 'In Stock' | 'Low Stock' | 'Out of Stock' => {
    if (stock === 0) return 'Out of Stock';
    if (stock <= 10) return 'Low Stock';
    return 'In Stock';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Stock':
        return 'green';
      case 'Low Stock':
        return 'orange';
      case 'Out of Stock':
        return 'red';
      default:
        return 'default';
    }
  };

  const columns: ColumnsType<Product> = [
    {
      title: 'Product',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Product) => (
        <div className="flex items-center gap-3">
          <img
            src={record.image || '/placeholder.svg'}
            alt={text}
            className="w-12 h-12 rounded-lg object-cover border border-gray-200"
          />
          <div>
            <div className="font-medium text-gray-900">{text}</div>
            <div className="text-sm text-gray-500">SKU: {record.sku}</div>
          </div>
        </div>
      ),
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      filters: [
        { text: 'T-Shirts', value: 'T-Shirts' },
        { text: 'Jeans', value: 'Jeans' },
        { text: 'Shoes', value: 'Shoes' },
        { text: 'Hoodies', value: 'Hoodies' },
        { text: 'Dresses', value: 'Dresses' },
      ],
      onFilter: (value, record) => record.category === value,
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => `€${price.toFixed(2)}`,
      sorter: (a, b) => a.price - b.price,
    },
    {
      title: 'Stock',
      dataIndex: 'stock',
      key: 'stock',
      render: (stock: number, record: Product) => (
        <div className="flex items-center gap-2">
          <span
            className={`font-medium ${
              stock === 0
                ? 'text-red-600'
                : stock <= 10
                ? 'text-orange-600'
                : 'text-green-600'
            }`}
          >
            {stock}
          </span>
          {stock <= 10 && stock > 0 && (
            <AlertOutlined className="text-orange-500 text-xs" />
          )}
        </div>
      ),
      sorter: (a, b) => a.stock - b.stock,
    },
    {
      title: 'Sold',
      dataIndex: 'sold',
      key: 'sold',
      sorter: (a, b) => a.sold - b.sold,
    },
    {
      title: 'Revenue',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (revenue: number) => `€${revenue.toFixed(2)}`,
      sorter: (a, b) => a.revenue - b.revenue,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)} className="border-0">
          {status}
        </Tag>
      ),
      filters: [
        { text: 'In Stock', value: 'In Stock' },
        { text: 'Low Stock', value: 'Low Stock' },
        { text: 'Out of Stock', value: 'Out of Stock' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record: Product) => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'view',
                icon: <EyeOutlined />,
                label: 'View Details',
              },
              {
                key: 'edit',
                icon: <EditOutlined />,
                label: 'Edit Product',
                onClick: () => handleEditProduct(record),
              },
              {
                key: 'duplicate',
                icon: <CopyOutlined />,
                label: 'Duplicate',
              },
              {
                type: 'divider',
              },
              {
                key: 'delete',
                icon: <DeleteOutlined />,
                label: 'Delete',
                danger: true,
                onClick: () => handleDeleteProduct(record.id),
              },
            ],
          }}
          trigger={['click']}
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
  };

  return (
    <Layout>
      <Content className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Title level={2} className="!mb-1 !text-gray-900">
              Inventory Management
            </Title>
            <Text className="text-gray-500">
              Manage your products and stock levels
            </Text>
          </div>
          <Space>
            <Button icon={<ImportOutlined />}>Import</Button>
            <Button icon={<ExportOutlined />}>Export</Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              className="bg-cyan-500 border-cyan-500"
              onClick={handleAddProduct}
            >
              Add Product
            </Button>
          </Space>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="border-l-4 border-l-cyan-500">
            <Statistic
              title="Total Products"
              value={totalProducts}
              prefix={<ShoppingOutlined className="text-cyan-500" />}
            />
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <Statistic
              title="In Stock"
              value={inStock}
              prefix={<CheckCircleOutlined className="text-green-500" />}
            />
          </Card>
          <Card className="border-l-4 border-l-orange-500">
            <Statistic
              title="Low Stock"
              value={lowStock}
              prefix={<ExclamationCircleOutlined className="text-orange-500" />}
            />
          </Card>
          <Card className="border-l-4 border-l-red-500">
            <Statistic
              title="Out of Stock"
              value={outOfStock}
              prefix={<AlertOutlined className="text-red-500" />}
            />
          </Card>
        </div>

        <Card className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Space wrap>
              <Select
                placeholder="Category"
                style={{ width: 120 }}
                value={categoryFilter}
                onChange={setCategoryFilter}
              >
                <Select.Option value="all">All Categories</Select.Option>
                <Select.Option value="T-Shirts">T-Shirts</Select.Option>
                <Select.Option value="Jeans">Jeans</Select.Option>
                <Select.Option value="Shoes">Shoes</Select.Option>
                <Select.Option value="Hoodies">Hoodies</Select.Option>
                <Select.Option value="Dresses">Dresses</Select.Option>
              </Select>
              <Select
                placeholder="Status"
                style={{ width: 120 }}
                value={statusFilter}
                onChange={setStatusFilter}
              >
                <Select.Option value="all">All Status</Select.Option>
                <Select.Option value="In Stock">In Stock</Select.Option>
                <Select.Option value="Low Stock">Low Stock</Select.Option>
                <Select.Option value="Out of Stock">Out of Stock</Select.Option>
              </Select>
            </Space>
            <Input
              placeholder="Search products, SKU..."
              prefix={<SearchOutlined className="text-gray-400" />}
              className="max-w-md"
              size="large"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            {selectedRowKeys.length > 0 && (
              <Space>
                <Text className="text-gray-600">
                  {selectedRowKeys.length} selected
                </Text>
                <Button size="small">Bulk Edit</Button>
                <Button size="small" danger>
                  Bulk Delete
                </Button>
              </Space>
            )}
          </div>
        </Card>

        {/* Products Table */}
        <Card>
          <Table
            columns={columns}
            dataSource={filteredProducts}
            rowSelection={rowSelection}
            pagination={{
              total: filteredProducts.length,
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} products`,
            }}
            scroll={{ x: 1200 }}
            className="custom-table"
          />
        </Card>

        {/* Add/Edit Product Modal */}
        <Modal
          title={editingProduct ? 'Edit Product' : 'Add New Product'}
          open={isModalVisible}
          onOk={handleModalOk}
          onCancel={() => setIsModalVisible(false)}
          width={800}
          okText={editingProduct ? 'Update Product' : 'Add Product'}
          okButtonProps={{ className: 'bg-cyan-500 border-cyan-500' }}
        >
          <Form form={form} layout="vertical" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item
                name="name"
                label="Product Name"
                rules={[
                  { required: true, message: 'Please enter product name' },
                ]}
              >
                <Input placeholder="Enter product name" />
              </Form.Item>

              <Form.Item
                name="sku"
                label="SKU"
                rules={[{ required: true, message: 'Please enter SKU' }]}
              >
                <Input placeholder="Enter SKU" />
              </Form.Item>

              <Form.Item
                name="category"
                label="Category"
                rules={[{ required: true, message: 'Please select category' }]}
              >
                <Select placeholder="Select category">
                  <Select.Option value="T-Shirts">T-Shirts</Select.Option>
                  <Select.Option value="Jeans">Jeans</Select.Option>
                  <Select.Option value="Shoes">Shoes</Select.Option>
                  <Select.Option value="Hoodies">Hoodies</Select.Option>
                  <Select.Option value="Dresses">Dresses</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="price"
                label="Price (€)"
                rules={[{ required: true, message: 'Please enter price' }]}
              >
                <InputNumber
                  min={0}
                  step={0.01}
                  placeholder="0.00"
                  className="w-full"
                />
              </Form.Item>

              <Form.Item
                name="stock"
                label="Stock Quantity"
                rules={[
                  { required: true, message: 'Please enter stock quantity' },
                ]}
              >
                <InputNumber min={0} placeholder="0" className="w-full" />
              </Form.Item>

              <Form.Item name="image" label="Product Image">
                <Input placeholder="Image URL" />
              </Form.Item>
            </div>

            <Form.Item name="description" label="Description">
              <Input.TextArea
                rows={3}
                placeholder="Enter product description"
              />
            </Form.Item>

            <Form.Item name="tags" label="Tags">
              <Select mode="tags" placeholder="Add tags" className="w-full" />
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
}
