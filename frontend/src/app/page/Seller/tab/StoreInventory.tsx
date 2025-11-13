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
  Switch,
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
import { ProductForm } from '../../../components/seller/ProductFormWizard';
import { EditProductForm } from '../../../components/seller/EditProductForm';
import ProductDetailModal, {
  ProductDetail as ProductForDetail,
} from '../../../components/seller/ProductDetailModal';
const { Content } = Layout;
const { Title, Text } = Typography;

export interface Product {
  key: string;
  id: string;
  name: string;
  category: string;
  base_price: number;
  brandId: number;
  brandName?: string;
  stock?: number;
  sold?: number;
  revenue: number;
  status: 'Còn Hàng' | 'Sắp Hết Hàng' | 'Hết Hàng';
  statusApi: 'active' | 'draft';
  image: string;
  sku: string;
  short_description: string;
  description: string;
  tags: string[];
  createdAt: string;
  categories: { id: number; name: string }[];
  media: {
    media_type: string;
    url: string;
    is_primary?: boolean;
    sort_order?: number;
    file?: File;
  }[];
  variants: {
    id?: number;
    sku: string;
    variant_name: string;
    price: number;
    stock: number;
    barcode?: string;
    inventories?: {
      id?: number;
      location: string;
      quantity: number;
      used_quantity?: number;
    }[];
  }[];

  pricing_rules: {
    type: string;
    min_quantity: number;
    price: number;
    cycle?: string;
    starts_at?: string | Date;
    ends_at?: string | Date;
    variant_sku?: string;
    name?: string;
    status?: 'active' | 'inactive';
    limit_quantity?: number;
    schedule?: { id: number } | null;
  }[];
  apiId?: number; // To link with backend
}

export default function StoreInventory() {
  const BE_BASE_URL = import.meta.env.VITE_BE_BASE_URL;
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
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);

  const [isAddWizardVisible, setAddWizardVisible] = useState(false);
  const handleProductUpdated = (updatedProduct: Product) => {
    setProducts((prev) =>
      prev.map((p) => (p.apiId === updatedProduct.apiId ? updatedProduct : p))
    );
  };

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
      const store = await storeService.getMyStore();
      if (store) {
        setStores([store]); // 👈 bọc object thành array
        setSelectedStoreId(store.id);
      } else {
        setStores([]);
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

      if (!Array.isArray(apiProducts)) {
        console.error('API không trả về mảng:', apiProducts);
        message.error('Dữ liệu sản phẩm không hợp lệ');
        setProducts([]);
        return;
      }

      // ✅ Lọc chỉ lấy sản phẩm active
      const activeProducts = apiProducts.filter(
        (p: ApiProduct) => p.status !== 'deleted'
      );

      const mappedProducts: Product[] = activeProducts.map(
        (apiProduct: ApiProduct) => {
          // Lấy ảnh chính
          const primaryImage =
            apiProduct.media?.find(
              (m) => m.is_primary && m.media_type === 'image'
            )?.url || '/placeholder.svg';

          const imageUrl = primaryImage.startsWith('/uploads')
            ? `${BE_BASE_URL}${primaryImage}`
            : primaryImage;

          // Lấy tên category để hiển thị
          const categoryName =
            apiProduct.categories?.[0]?.category?.name || 'Chung';

          // Lấy stock & price
          const stock = apiProduct.variants?.[0]?.stock || 0;
          const rawPrice =
            apiProduct.variants?.[0]?.price || apiProduct.base_price || 0;
          const price =
            typeof rawPrice === 'string'
              ? parseFloat(rawPrice)
              : Number(rawPrice);
          const finalPrice = isNaN(price) ? 0 : price;

          // Tính sold & revenue
          const sold = apiProduct.sold ?? 0;
          const revenue = apiProduct.revenue ?? 0;
          // Trạng thái
          const status = getStockStatus(stock);

          return {
            key: apiProduct.id.toString(),
            id: `PRD${String(apiProduct.id).padStart(3, '0')}`,
            name: apiProduct.name || 'Sản Phẩm Không Xác Định',
            category: categoryName,
            base_price: finalPrice,
            stock,
            sold,
            revenue,
            status,
            statusApi: apiProduct.status as 'active' | 'draft',
            image: imageUrl,
            sku: apiProduct.variants?.[0]?.sku || `SKU${apiProduct.id}`,
            short_description: apiProduct.short_description || '',
            description: apiProduct.description || '',
            tags: [],
            createdAt:
              apiProduct.created_at?.split('T')[0] ||
              new Date().toISOString().split('T')[0],
            apiId: apiProduct.id,
            brandId: apiProduct.brand?.id || apiProduct.brand_id || 0,
            brandName: apiProduct.brand?.name || '',

            categories:
              apiProduct.categories?.map((c) => ({
                id: c.category_id || c.id,
                name: c.category?.name || '',
              })) || [],

            media:
              apiProduct.media?.map((m) => ({
                media_type: m.media_type,
                url: m.url.startsWith('/uploads')
                  ? `${BE_BASE_URL}${m.url}`
                  : m.url,
                is_primary: m.is_primary || false,
                sort_order: m.sort_order,
              })) || [],

            variants:
              apiProduct.variants?.map((v) => ({
                id: v.id,
                sku: v.sku,
                variant_name: v.variant_name,
                price:
                  typeof v.price === 'string' ? parseFloat(v.price) : v.price,
                stock: v.stock,
                barcode: v.barcode,
                inventories:
                  v.inventories?.map((inv) => ({
                    id: inv.id,
                    location: inv.location,
                    quantity: inv.quantity,
                    used_quantity: inv.used_quantity || 0,
                  })) || [],
              })) || [],

            // ✅ pricing_rules
            pricing_rules:
              (apiProduct.pricing_rules as any[])?.map((rule) => ({
                type: rule.type,
                min_quantity: rule.min_quantity,
                price:
                  typeof rule.price === 'string'
                    ? parseFloat(rule.price)
                    : rule.price,
                cycle: rule.cycle || undefined,
                starts_at: rule.starts_at
                  ? new Date(rule.starts_at)
                  : undefined,
                ends_at: rule.ends_at ? new Date(rule.ends_at) : undefined,
                variant_sku: rule.variant?.sku || undefined,
                name: rule.name || '',
                status: rule.status === 'active' ? 'active' : 'inactive',
                limit_quantity: rule.limit_quantity,
                schedule: rule.schedule?.id ? { id: rule.schedule.id } : null, // ✅ đổi từ schedule_id
              })) || [],
          };
        }
      );

      console.log('Danh Sách Sản Phẩm Active:', mappedProducts);
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
  const [editingProductApi, setEditingProductApi] = useState<ApiProduct | null>(
    null
  );

  const handleAddProduct = () => {
    setEditingProduct(null);
    form.resetFields();
    setAddWizardVisible(true);
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
          await productService.softDeleteProduct(apiId);
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

        const formData = new FormData();
        formData.append('name', values.name);
        formData.append('description', values.description);
        formData.append('base_price', values.price);

        await productService.updateProduct(editingProduct.apiId, formData);

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
          description: values.description,
          base_price: values.price,
          brandId: values.brandId, // Có thể cần lấy từ nguồn khác
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
      dataIndex: 'base_price',
      key: 'base_price',
      render: (price: number) => `₫${price.toLocaleString('vi-VN')}`,
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
      sorter: (a, b) => (a.stock ?? 0) - (b.stock ?? 0),
    },
    {
      title: 'Đã Bán',
      dataIndex: 'sold',
      key: 'sold',
      sorter: (a, b) => (a.sold ?? 0) - (b.sold ?? 0),
    },
    {
      title: 'Doanh Thu',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (revenue: number) => `₫${revenue.toLocaleString('vi-VN')}`,
      sorter: (a, b) => (a.revenue ?? 0) - (b.revenue ?? 0),
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
      title: 'Tình Trạng',
      dataIndex: 'statusApi',
      key: 'statusApi',
      render: (_: any, record: Product) => (
        <Switch
          checked={record.statusApi === 'active'}
          checkedChildren="Active"
          unCheckedChildren="Draft"
          onChange={async () => {
            if (!record.apiId) {
              message.error('Không thể cập nhật sản phẩm không có API ID');
              return;
            }

            try {
              // Gọi API toggle trạng thái sản phẩm
              const updatedProduct = await productService.toggleProductStatus(
                record.apiId
              );

              // Xác định newStatus type-safe
              const newStatus: 'active' | 'draft' =
                updatedProduct.status === 'active' ? 'active' : 'draft';

              // Cập nhật state products để UI thay đổi ngay
              setProducts((prev) =>
                prev.map((p) =>
                  p.apiId === record.apiId ? { ...p, statusApi: newStatus } : p
                )
              );

              message.success(`Cập nhật trạng thái thành ${newStatus}`);
            } catch (error) {
              message.error('Cập nhật trạng thái thất bại');
              console.error(error);
            }
          }}
        />
      ),
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
                onClick: () => setDetailProduct(record),
              },
              {
                key: 'edit',
                icon: <EditOutlined />,
                label: 'Chỉnh Sửa Sản Phẩm',
                onClick: () => setEditingProduct(record),
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
  const uniqueCategories = Array.from(new Set(products.map((p) => p.category)));
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
                style={{ width: 200 }}
                value={categoryFilter}
                onChange={setCategoryFilter}
              >
                <Select.Option value="all">Tất Cả Danh Mục</Select.Option>
                {uniqueCategories.map((cat) => (
                  <Select.Option key={cat} value={cat}>
                    {cat}
                  </Select.Option>
                ))}
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
          title="Thêm Sản Phẩm Mới"
          open={isAddWizardVisible}
          onCancel={() => setAddWizardVisible(false)}
          footer={null}
          width={1000}
          destroyOnClose
        >
          <ProductForm />
        </Modal>
        {editingProduct && (
          <Modal
            open={true}
            onCancel={() => setEditingProduct(null)}
            footer={null}
            width={800}
          >
            <EditProductForm
              product={editingProduct}
              onClose={() => setEditingProduct(null)}
              onProductUpdated={handleProductUpdated}
            />
          </Modal>
        )}

        <ProductDetailModal
          product={detailProduct as unknown as ProductForDetail | null}
          onClose={() => setDetailProduct(null)}
          onEdit={(p) => {
            // bấm "Chỉnh sửa" trong modal chi tiết → mở modal Edit có sẵn
            setDetailProduct(null);
            setEditingProduct(p as unknown as Product);
          }}
        />
      </Content>
    </Layout>
  );
}
