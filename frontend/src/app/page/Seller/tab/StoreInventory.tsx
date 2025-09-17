import { useState, useEffect } from 'react';
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
  message,
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
import {
  productService,
  Product as ApiProduct,
  CreateProductDto,
  UpdateProductDto,
} from '../../../../service/product.service';
import { storeService, Store } from '../../../../service/store.service';
import StockBadge from '../../../components/seller/StockBadge';
import type { StatisticProps } from 'antd';
import CountUp from 'react-countup';
import ExportCascader from '../../../components/seller/ExportCascader';

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
  apiId?: number; // To link with backend
}

export default function StoreInventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [form] = Form.useForm();
  

  useEffect(() => {
    fetchStores();
  }, []);

  useEffect(() => {
    if (selectedStoreId) {
      // console.log(selectedStoreId);
      fetchProducts();
    } else {
      setProducts([]);
    }
  }, [selectedStoreId]);

  const fetchStores = async () => {
    try {
      const userStores = await storeService.getMyStores();
      setStores(userStores);
      if (userStores.length > 0) {
        setSelectedStoreId(userStores[0].id);
      }
    } catch (error) {
      message.error('Failed to fetch stores');
      console.error('Error fetching stores:', error);
    }
  };

  const fetchProducts = async () => {
    if (!selectedStoreId) return;

    setLoading(true);
    try {
      const apiProducts = await productService.getStoreProducts(
        selectedStoreId
      );
      console.log('API Products:', apiProducts);
      if (!Array.isArray(apiProducts)) {
        console.error('API did not return an array:', apiProducts);
        message.error('Invalid product data received');
        setProducts([]);
        return;
      }
      const mappedProducts: Product[] = apiProducts.map(
        (apiProduct: ApiProduct, index: number) => {
          // Get primary image URL or fallback to placeholder
          const primaryImage =
            apiProduct.media?.find(
              (m) => m.is_primary && m.media_type === 'image'
            )?.url || '/placeholder.svg';

          // Get first valid category name or fallback to 'General'
          const categoryName =
            apiProduct.categories?.find((c) => c.category?.name)?.category
              ?.name || 'General';

          // Get stock from first variant or fallback to 0
          const stock = apiProduct.variants?.[0]?.stock || 0;

          // Convert price to number, handling string or number input
          const rawPrice =
            apiProduct.variants?.[0]?.price || apiProduct.base_price || 0;
          const price =
            typeof rawPrice === 'string'
              ? parseFloat(rawPrice)
              : Number(rawPrice);
          // Ensure price is a valid number, fallback to 0 if NaN
          const finalPrice = isNaN(price) ? 0 : price;

          // Calculate sold and revenue (replace with real data if available)
          const sold = Math.floor(Math.random() * 50); // TODO: Replace with real data
          const revenue = finalPrice * sold;

          // Determine stock status
          const status = getStockStatus(stock);

          const mappedProduct = {
            key: apiProduct.id.toString(),
            id: `PRD${String(apiProduct.id).padStart(3, '0')}`,
            name: apiProduct.name || 'Unknown Product',
            category: categoryName,
            price: finalPrice,
            stock,
            sold,
            revenue,
            status,
            image: primaryImage,
            sku: apiProduct.variants?.[0]?.sku || `SKU${apiProduct.id}`,
            description: apiProduct.description || '',
            tags: [], // TODO: Fetch from product_tag table
            createdAt:
              apiProduct.created_at?.split('T')[0] ||
              new Date().toISOString().split('T')[0],
            apiId: apiProduct.id,
          };
          console.log('Mapped Product:', mappedProduct);
          return mappedProduct;
        }
      );
      console.log('Mapped Products:', mappedProducts);
      setProducts(mappedProducts);
    } catch (error) {
      message.error('Failed to fetch products');
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  console.log(products);

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

  const handleDeleteProduct = async (productId: string, apiId?: number) => {
    if (!apiId) {
      message.error('Cannot delete product without API ID');
      return;
    }

    Modal.confirm({
      title: 'Delete Product',
      content: 'Are you sure you want to delete this product?',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await productService.deleteProduct(apiId);
          setProducts(products.filter((p) => p.id !== productId));
          message.success('Product deleted successfully');
        } catch (error) {
          message.error('Failed to delete product');
          console.error('Error deleting product:', error);
        }
      },
    });
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();

      if (editingProduct) {
        // Update existing product
        if (!editingProduct.apiId) {
          message.error('Cannot update product without API ID');
          return;
        }

        const updateDto: UpdateProductDto = {
          name: values.name,
          slug: values.name.toLowerCase().replace(/\s+/g, '-'),
          description: values.description,
          base_price: values.price,
        };

        await productService.updateProduct(editingProduct.apiId, updateDto);

        setProducts(
          products.map((p) =>
            p.id === editingProduct.id
              ? { ...p, ...values, status: getStockStatus(values.stock) }
              : p
          )
        );
        message.success('Product updated successfully');
      } else {
        // Add new product
        const createDto: CreateProductDto = {
          name: values.name,
          slug: values.name.toLowerCase().replace(/\s+/g, '-'),
          description: values.description,
          base_price: values.price,
          brand_id: 1, // You may need to get this from somewhere
        };

        const newApiProduct = await productService.createProduct(createDto);

        const newProduct: Product = {
          ...values,
          key: newApiProduct.id.toString(),
          id: `PRD${String(newApiProduct.id).padStart(3, '0')}`,
          sold: 0,
          revenue: 0,
          status: getStockStatus(values.stock),
          createdAt: new Date().toISOString().split('T')[0],
          tags: values.tags || [],
          apiId: newApiProduct.id,
        };
        setProducts([...products, newProduct]);
        message.success('Product created successfully');
      }
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('Failed to save product');
      console.error('Error saving product:', error);
    }
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
        { text: 'General', value: 'General' },
        // Add more categories as needed
      ],
      onFilter: (value, record) => record.category === value,
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => `€${price}`,
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
                onClick: () => handleDeleteProduct(record.id, record.apiId),
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

  const formatter: StatisticProps['formatter'] = (value) => (
  <CountUp end={value as number} separator="," />
);

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
            <Select
              placeholder="Select Store"
              value={selectedStoreId}
              onChange={setSelectedStoreId}
              style={{ width: 200 }}
            >
              {stores.map((store) => (
                <Select.Option key={store.id} value={store.id}>
                  {store.name}
                </Select.Option>
              ))}
            </Select>
            <ExportCascader/>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              className="bg-cyan-500 border-cyan-500"
              onClick={handleAddProduct}
              disabled={!selectedStoreId}
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
            <Statistic title="Total product values: " value={totalValue} precision={2} formatter={formatter} />
          </Card>
          <Card>
            <StockBadge
              inStock={inStock}
              lowStock={lowStock}
              outOfStock={outOfStock}
              showToggle={true}
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
                <Select.Option value="General">General</Select.Option>
                {/* Add more categories */}
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
            loading={loading}
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
                  <Select.Option value="General">General</Select.Option>
                  {/* Add more categories */}
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
