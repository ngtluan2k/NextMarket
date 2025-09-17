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
  status: 'Còn Hàng' | 'Sắp Hết Hàng' | 'Hết Hàng';
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
      message.error('Không thể tải danh sách cửa hàng');
      console.error('Lỗi khi tải cửa hàng:', error);
    }
  };

  const fetchProducts = async () => {
    if (!selectedStoreId) return;

    setLoading(true);
    try {
      const apiProducts = await productService.getStoreProducts(
        selectedStoreId
      );
      // console.log('API Products:', apiProducts);
      if (!Array.isArray(apiProducts)) {
        console.error('API không trả về mảng:', apiProducts);
        message.error('Dữ liệu sản phẩm không hợp lệ');
        setProducts([]);
        return;
      }
      const mappedProducts: Product[] = apiProducts.map(
        (apiProduct: ApiProduct, index: number) => {
          const primaryImage =
            apiProduct.media?.find(
              (m) => m.is_primary && m.media_type === 'image'
            )?.url || '/placeholder.svg';

          const categoryName =
            apiProduct.categories?.find((c) => c.category?.name)?.category
              ?.name || 'Chung';

          const stock = apiProduct.variants?.[0]?.stock || 0;

          const rawPrice =
            apiProduct.variants?.[0]?.price || apiProduct.base_price || 0;
          const price =
            typeof rawPrice === 'string'
              ? parseFloat(rawPrice)
              : Number(rawPrice);
          const finalPrice = isNaN(price) ? 0 : price;

          const sold = Math.floor(Math.random() * 50); // TODO: Thay bằng dữ liệu thực tế
          const revenue = finalPrice * sold;

          const status = getStockStatus(stock);

          const mappedProduct = {
            key: apiProduct.id.toString(),
            id: `PRD${String(apiProduct.id).padStart(3, '0')}`,
            name: apiProduct.name || 'Sản Phẩm Không Xác Định',
            category: categoryName,
            price: finalPrice,
            stock,
            sold,
            revenue,
            status,
            image: primaryImage,
            sku: apiProduct.variants?.[0]?.sku || `SKU${apiProduct.id}`,
            description: apiProduct.description || '',
            tags: [], // TODO: Lấy từ bảng product_tag
            createdAt:
              apiProduct.created_at?.split('T')[0] ||
              new Date().toISOString().split('T')[0],
            apiId: apiProduct.id,
          };
          // console.log('Sản Phẩm Đã Ánh Xạ:', mappedProduct);
          return mappedProduct;
        }
      );
      console.log('Danh Sách Sản Phẩm Đã Ánh Xạ:', mappedProducts);
      setProducts(mappedProducts);
    } catch (error) {
      message.error('Không thể tải danh sách sản phẩm');
      console.error('Lỗi khi tải sản phẩm:', error);
    } finally {
      setLoading(false);
    }
  };

  // console.log(products);

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
  const inStock = products.filter((p) => p.status === 'Còn Hàng').length;
  const lowStock = products.filter((p) => p.status === 'Sắp Hết Hàng').length;
  const outOfStock = products.filter((p) => p.status === 'Hết Hàng').length;
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
      message.error('Không thể xóa sản phẩm không có API ID');
      return;
    }

    Modal.confirm({
      title: 'Xóa Sản Phẩm',
      content: 'Bạn có chắc chắn muốn xóa sản phẩm này?',
      okText: 'Xóa',
      okType: 'danger',
      onOk: async () => {
        try {
          await productService.deleteProduct(apiId);
          setProducts(products.filter((p) => p.id !== productId));
          message.success('Xóa sản phẩm thành công');
        } catch (error) {
          message.error('Không thể xóa sản phẩm');
          console.error('Lỗi khi xóa sản phẩm:', error);
        }
      },
    });
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();

      if (editingProduct) {
        if (!editingProduct.apiId) {
          message.error('Không thể cập nhật sản phẩm không có API ID');
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
        message.success('Cập nhật sản phẩm thành công');
      } else {
        const createDto: CreateProductDto = {
          name: values.name,
          slug: values.name.toLowerCase().replace(/\s+/g, '-'),
          description: values.description,
          base_price: values.price,
          brand_id: 1, // Có thể cần lấy từ nguồn khác
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
        message.success('Tạo sản phẩm thành công');
      }
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('Không thể lưu sản phẩm');
      console.error('Lỗi khi lưu sản phẩm:', error);
    }
  };

  const getStockStatus = (
    stock: number
  ): 'Còn Hàng' | 'Sắp Hết Hàng' | 'Hết Hàng' => {
    if (stock === 0) return 'Hết Hàng';
    if (stock <= 10) return 'Sắp Hết Hàng';
    return 'Còn Hàng';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Còn Hàng':
        return 'green';
      case 'Sắp Hết Hàng':
        return 'orange';
      case 'Hết Hàng':
        return 'red';
      default:
        return 'default';
    }
  };

  const columns: ColumnsType<Product> = [
    {
      title: 'Sản Phẩm',
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
      title: 'Danh Mục',
      dataIndex: 'category',
      key: 'category',
      filters: [
        { text: 'Chung', value: 'Chung' },
        // Thêm các danh mục khác nếu cần
      ],
      onFilter: (value, record) => record.category === value,
    },
    {
      title: 'Giá',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => `₫${price.toLocaleString('vi-VN')}`,
      sorter: (a, b) => a.price - b.price,
    },
    {
      title: 'Tồn Kho',
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
      title: 'Đã Bán',
      dataIndex: 'sold',
      key: 'sold',
      sorter: (a, b) => a.sold - b.sold,
    },
    {
      title: 'Doanh Thu',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (revenue: number) => `₫${revenue.toLocaleString('vi-VN')}`,
      sorter: (a, b) => a.revenue - b.revenue,
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)} className="border-0">
          {status}
        </Tag>
      ),
      filters: [
        { text: 'Còn Hàng', value: 'Còn Hàng' },
        { text: 'Sắp Hết Hàng', value: 'Sắp Hết Hàng' },
        { text: 'Hết Hàng', value: 'Hết Hàng' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Hành Động',
      key: 'actions',
      render: (_, record: Product) => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'view',
                icon: <EyeOutlined />,
                label: 'Xem Chi Tiết',
              },
              {
                key: 'edit',
                icon: <EditOutlined />,
                label: 'Chỉnh Sửa Sản Phẩm',
                onClick: () => handleEditProduct(record),
              },
              {
                key: 'duplicate',
                icon: <CopyOutlined />,
                label: 'Sao Chép',
              },
              {
                type: 'divider',
              },
              {
                key: 'delete',
                icon: <DeleteOutlined />,
                label: 'Xóa',
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
              Quản Lý Kho Hàng
            </Title>
            <Text className="text-gray-500">
              Quản lý sản phẩm và mức tồn kho của bạn
            </Text>
          </div>
          <Space>
            <Select
              placeholder="Chọn Cửa Hàng"
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
            <ExportCascader />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              className="bg-cyan-500 border-cyan-500"
              onClick={handleAddProduct}
              disabled={!selectedStoreId}
            >
              Thêm Sản Phẩm
            </Button>
          </Space>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="border-l-4 border-l-cyan-500">
            <Statistic
              title="Tổng Sản Phẩm"
              value={totalProducts}
              prefix={<ShoppingOutlined className="text-cyan-500" />}
            />
            <Statistic
              title="Tổng giá trị sản phẩm:"
              value={totalValue}
              precision={2}
              formatter={formatter}
            />
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
                placeholder="Danh Mục"
                style={{ width: 120 }}
                value={categoryFilter}
                onChange={setCategoryFilter}
              >
                <Select.Option value="all">Tất Cả Danh Mục</Select.Option>
                <Select.Option value="Chung">Chung</Select.Option>
                {/* Thêm các danh mục khác */}
              </Select>
              <Select
                placeholder="Trạng Thái"
                style={{ width: 120 }}
                value={statusFilter}
                onChange={setStatusFilter}
              >
                <Select.Option value="all">Tất Cả Trạng Thái</Select.Option>
                <Select.Option value="Còn Hàng">Còn Hàng</Select.Option>
                <Select.Option value="Sắp Hết Hàng">Sắp Hết Hàng</Select.Option>
                <Select.Option value="Hết Hàng">Hết Hàng</Select.Option>
              </Select>
            </Space>
            <Input
              placeholder="Tìm kiếm sản phẩm, SKU..."
              prefix={<SearchOutlined className="text-gray-400" />}
              className="max-w-md"
              size="large"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            {selectedRowKeys.length > 0 && (
              <Space>
                <Text className="text-gray-600">
                  Đã chọn {selectedRowKeys.length}
                </Text>
                <Button size="small">Chỉnh Sửa Hàng Loạt</Button>
                <Button size="small" danger>
                  Xóa Hàng Loạt
                </Button>
              </Space>
            )}
          </div>
        </Card>

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
                `${range[0]}-${range[1]} trên tổng số ${total} sản phẩm`,
            }}
            scroll={{ x: 1200 }}
            className="custom-table"
          />
        </Card>

        <Modal
          title={editingProduct ? 'Chỉnh Sửa Sản Phẩm' : 'Thêm Sản Phẩm Mới'}
          open={isModalVisible}
          onOk={handleModalOk}
          onCancel={() => setIsModalVisible(false)}
          width={800}
          okText={editingProduct ? 'Cập Nhật Sản Phẩm' : 'Thêm Sản Phẩm'}
          okButtonProps={{ className: 'bg-cyan-500 border-cyan-500' }}
        >
          <Form form={form} layout="vertical" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item
                name="name"
                label="Tên Sản Phẩm"
                rules={[
                  { required: true, message: 'Vui lòng nhập tên sản phẩm' },
                ]}
              >
                <Input placeholder="Nhập tên sản phẩm" />
              </Form.Item>

              <Form.Item
                name="sku"
                label="SKU"
                rules={[{ required: true, message: 'Vui lòng nhập SKU' }]}
              >
                <Input placeholder="Nhập SKU" />
              </Form.Item>

              <Form.Item
                name="category"
                label="Danh Mục"
                rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}
              >
                <Select placeholder="Chọn danh mục">
                  <Select.Option value="Chung">Chung</Select.Option>
                  {/* Thêm các danh mục khác */}
                </Select>
              </Form.Item>

              <Form.Item
                name="price"
                label="Giá (₫)"
                rules={[{ required: true, message: 'Vui lòng nhập giá' }]}
              >
                <InputNumber
                  min={0}
                  step={1000}
                  placeholder="0"
                  className="w-full"
                />
              </Form.Item>

              <Form.Item
                name="stock"
                label="Số Lượng Tồn Kho"
                rules={[
                  { required: true, message: 'Vui lòng nhập số lượng tồn kho' },
                ]}
              >
                <InputNumber min={0} placeholder="0" className="w-full" />
              </Form.Item>

              <Form.Item name="image" label="Hình Ảnh Sản Phẩm">
                <Input placeholder="URL hình ảnh" />
              </Form.Item>
            </div>

            <Form.Item name="description" label="Mô Tả">
              <Input.TextArea rows={3} placeholder="Nhập mô tả sản phẩm" />
            </Form.Item>

            <Form.Item name="tags" label="Thẻ">
              <Select mode="tags" placeholder="Thêm thẻ" className="w-full" />
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
}
