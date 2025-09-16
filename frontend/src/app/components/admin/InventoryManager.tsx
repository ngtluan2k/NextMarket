// src/components/admin/InventoryManager.tsx
import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Space,
  Card,
  Statistic,
  Tag,
  Row,
  Col,
  message,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  WarningOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;

interface Store {
  id: number;
  name: string;
  user_id: number;
}

interface Brand {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  store?: Store;
  brand?: Brand;
}

interface Variant {
  id: number;
  name: string;
  product_id: number;
  price?: number;
  stock?: number;
}

interface Inventory {
  id: number;
  uuid: string;
  product: Product;
  variant?: Variant;
  location: string;
  quantity: number;
  used_quantity: number;
  updated_at: string;
  available_quantity: number;
}

interface CreateInventoryDto {
  productId: number;
  variantId: number;
  location: string;
  quantity: number;
  used_quantity?: number;
}

const InventoryManager: React.FC = () => {
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingInventory, setEditingInventory] = useState<Inventory | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const token = localStorage.getItem('token');

  // ==== Statistics ====
  const totalItems = inventories.reduce((sum, inv) => sum + inv.quantity, 0);
  const totalUsed = inventories.reduce(
    (sum, inv) => sum + inv.used_quantity,
    0
  );
  const totalAvailable = inventories.reduce(
    (sum, inv) => sum + inv.available_quantity,
    0
  );
  const lowStockItems = inventories.filter(
    (inv) => inv.available_quantity < 10
  ).length;

  useEffect(() => {
    const loadData = async () => {
      await fetchInventories();
      await fetchProducts();
    };
    loadData();
  }, []);

  // ==== API Configuration ====
  const apiClient = axios.create({
    baseURL: 'http://localhost:3000',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  // Add response interceptor for error handling
  apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
      const errorMessage =
        error.response?.data?.message || error.message || 'An error occurred';
      message.error(errorMessage);
      return Promise.reject(error);
    }
  );

  // ==== API calls ====
  const fetchInventories = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/inventory');
      console.log('Inventory API response:', res.data);

      // BE returns array of inventories with relations
      const inventoryData = Array.isArray(res.data) ? res.data : [];

      const mapped: Inventory[] = inventoryData.map((inv: any) => {
        console.log('Raw inventory item:', inv);

        return {
          id: inv.id,
          uuid: inv.uuid,
          product: {
            id: inv.product?.id,
            name: inv.product?.name,
            store: inv.product?.store
              ? {
                  id: inv.product.store.id,
                  name: inv.product.store.name,
                  user_id: inv.product.store.user_id,
                }
              : undefined,
            brand: inv.product?.brand
              ? {
                  id: inv.product.brand.id,
                  name: inv.product.brand.name,
                }
              : undefined,
          },
          variant: inv.variant
            ? {
                id: inv.variant.id,
                name: inv.variant.name,
                product_id: inv.variant.product_id,
                price: inv.variant.price,
                stock: inv.variant.stock,
              }
            : undefined,
          location: inv.location,
          quantity: inv.quantity,
          used_quantity: inv.used_quantity || 0,
          updated_at: inv.updated_at,
          available_quantity:
            inv.available_quantity || inv.quantity - (inv.used_quantity || 0),
        };
      });

      console.log('Mapped inventories:', mapped);
      setInventories(mapped);
    } catch (err: any) {
      console.error('Fetch inventories failed:', err);
      setInventories([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await apiClient.get('/products');
      console.log('Products API response:', res.data);

      // Assuming products endpoint returns array of products
      const productData = Array.isArray(res.data)
        ? res.data
        : res.data?.data || [];

      const mapped: Product[] = productData.map((p: any) => ({
        id: p.id,
        name: p.name,
        store: p.store
          ? {
              id: p.store.id,
              name: p.store.name,
              user_id: p.store.user_id,
            }
          : undefined,
        brand: p.brand
          ? {
              id: p.brand.id,
              name: p.brand.name,
            }
          : undefined,
      }));

      console.log('Mapped products:', mapped);
      setProducts(mapped);
    } catch (err: any) {
      console.error('Fetch products failed:', err);
      setProducts([]);
    }
  };

  const fetchVariantsByProduct = async (productId: number) => {
    try {
      const res = await apiClient.get(`/variants/product/${productId}`);
      console.log('Variants API response:', res.data);

      // Assuming variants endpoint returns array of variants
      const variantData = Array.isArray(res.data)
        ? res.data
        : res.data?.data || [];

      const mapped: Variant[] = variantData.map((v: any) => ({
        id: v.id,
        name: v.name,
        product_id: v.product_id,
        price: v.price,
        stock: v.stock,
      }));

      console.log('Mapped variants:', mapped);
      setVariants(mapped);
    } catch (err: any) {
      console.error('Fetch variants failed:', err);
      setVariants([]);
    }
  };

  // ==== CRUD handlers ====
  const handleSave = async (values: any) => {
    try {
      setLoading(true);
      const payload: CreateInventoryDto = {
        productId: values.productId,
        variantId: values.variantId || null,
        location: values.location,
        quantity: values.quantity,
        used_quantity: values.used_quantity || 0,
      };

      console.log('Save payload:', payload);

      let res;
      if (editingInventory) {
        res = await apiClient.patch(
          `/inventory/${editingInventory.id}`,
          payload
        );
        message.success('Cập nhật tồn kho thành công');
      } else {
        res = await apiClient.post('/inventory', payload);
        message.success('Thêm tồn kho thành công');
      }

      console.log('Save response:', res.data);

      setShowModal(false);
      setEditingInventory(null);
      form.resetFields();
      setVariants([]);
      await fetchInventories();
    } catch (err: any) {
      console.error('Save inventory failed:', err);
      // Error message handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (inventory: Inventory) => {
    setEditingInventory(inventory);
    form.setFieldsValue({
      productId: inventory.product.id,
      variantId: inventory.variant?.id,
      location: inventory.location,
      quantity: inventory.quantity,
      used_quantity: inventory.used_quantity,
    });

    if (inventory.product.id) {
      await fetchVariantsByProduct(inventory.product.id);
    }

    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa tồn kho này không?',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await apiClient.delete(`/inventory/${id}`);
          message.success('Xóa tồn kho thành công');
          console.log('Deleted inventory ID:', id);
          await fetchInventories();
        } catch (err: any) {
          console.error('Delete inventory failed:', err);
          // Error message handled by interceptor
        }
      },
    });
  };

  const handleProductChange = async (productId: number) => {
    form.setFieldValue('variantId', undefined);
    setVariants([]);
    if (productId) {
      await fetchVariantsByProduct(productId);
    }
  };

  const openAddModal = () => {
    setEditingInventory(null);
    form.resetFields();
    setVariants([]);
    setShowModal(true);
  };

  // ==== Helpers ====
  const getStockStatus = (available: number) => {
    if (available <= 0) return <Tag color="red">Hết hàng</Tag>;
    if (available < 10) return <Tag color="orange">Sắp hết</Tag>;
    if (available < 50) return <Tag color="yellow">Còn ít</Tag>;
    return <Tag color="green">Còn nhiều</Tag>;
  };

  // ==== Table Columns ====
  const columns = [
    {
      title: 'Sản phẩm',
      dataIndex: ['product', 'name'],
      key: 'product',
      width: 180,
      ellipsis: true,
      render: (name: string) => name || 'N/A',
    },
    {
      title: 'Thương hiệu',
      dataIndex: ['product', 'brand', 'name'],
      key: 'brand',
      width: 120,
      ellipsis: true,
      render: (name: string) => name || 'N/A',
    },
    {
      title: 'Biến thể',
      dataIndex: ['variant', 'name'],
      key: 'variant',
      width: 120,
      ellipsis: true,
      render: (name: string) => name || 'Không có biến thể',
    },
    {
      title: 'Vị trí',
      dataIndex: 'location',
      key: 'location',
      width: 100,
    },
    {
      title: 'Tổng SL',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 90,
      render: (quantity: number) => (
        <span className="font-semibold">{quantity?.toLocaleString() || 0}</span>
      ),
    },
    {
      title: 'Đã dùng',
      dataIndex: 'used_quantity',
      key: 'used_quantity',
      width: 90,
      render: (used: number) => (
        <span className="text-red-600">{used?.toLocaleString() || 0}</span>
      ),
    },
    {
      title: 'Khả dụng',
      key: 'available',
      width: 90,
      render: (record: Inventory) => (
        <span className="font-semibold text-green-600">
          {record.available_quantity?.toLocaleString() || 0}
        </span>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 100,
      render: (record: Inventory) =>
        getStockStatus(record.available_quantity || 0),
    },
    {
      title: 'Cập nhật',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 100,
      render: (date: string) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('vi-VN');
      },
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 100,
      fixed: 'right' as const,
      render: (record: Inventory) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => handleDelete(record.id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="h-full overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-900 m-0">Quản lý kho</h3>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openAddModal}
          size="middle"
        >
          Thêm tồn kho
        </Button>
      </div>

      {/* Statistics */}
      <Row gutter={12} className="mb-4">
        <Col xs={24} sm={12} md={6}>
          <Card size="small" className="h-20">
            <Statistic
              title="Tổng số lượng"
              value={totalItems}
              formatter={(value) => value?.toLocaleString() || '0'}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ fontSize: '18px', lineHeight: '1.2' }}
              className="text-center"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" className="h-20">
            <Statistic
              title="Đã sử dụng"
              value={totalUsed}
              formatter={(value) => value?.toLocaleString() || '0'}
              valueStyle={{
                color: '#cf1322',
                fontSize: '18px',
                lineHeight: '1.2',
              }}
              className="text-center"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" className="h-20">
            <Statistic
              title="Khả dụng"
              value={totalAvailable}
              formatter={(value) => value?.toLocaleString() || '0'}
              valueStyle={{
                color: '#389e0d',
                fontSize: '18px',
                lineHeight: '1.2',
              }}
              className="text-center"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" className="h-20">
            <Statistic
              title="Sắp hết hàng"
              value={lowStockItems}
              prefix={<WarningOutlined style={{ color: '#faad14' }} />}
              valueStyle={{
                color: '#faad14',
                fontSize: '18px',
                lineHeight: '1.2',
              }}
              className="text-center"
            />
          </Card>
        </Col>
      </Row>

      {/* Inventory Table */}
      <Card
        size="small"
        bodyStyle={{ padding: '12px' }}
        className="flex-1 overflow-hidden"
      >
        <Table
          dataSource={inventories}
          columns={columns}
          rowKey="id"
          loading={loading}
          size="small"
          pagination={{
            total: inventories.length,
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: false,
            showTotal: (total) => `Tổng ${total} mục`,
            size: 'small',
            pageSizeOptions: ['10', '20', '50'],
          }}
          className="compact-table"
          style={{ width: '100%' }} // 👈 Thêm
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editingInventory ? 'Cập nhật tồn kho' : 'Thêm tồn kho'}
        open={showModal}
        onCancel={() => {
          setShowModal(false);
          setEditingInventory(null);
          form.resetFields();
          setVariants([]);
        }}
        onOk={() => form.submit()}
        confirmLoading={loading}
        width={520}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          className="mt-4"
          size="small"
        >
          <Form.Item
            name="productId"
            label="Sản phẩm"
            rules={[{ required: true, message: 'Vui lòng chọn sản phẩm' }]}
          >
            <Select
              placeholder="Chọn sản phẩm"
              showSearch
              optionFilterProp="children"
              onChange={handleProductChange}
              loading={products.length === 0}
            >
              {products.map((product) => (
                <Option key={product.id} value={product.id}>
                  {product.name} {product.brand && `- ${product.brand.name}`}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="variantId"
            label="Biến thể"
            rules={
              variants.length > 0
                ? [{ required: true, message: 'Vui lòng chọn biến thể' }]
                : []
            }
          >
            <Select
              placeholder={
                variants.length === 0
                  ? 'Sản phẩm này không có biến thể'
                  : 'Chọn biến thể'
              }
              showSearch
              optionFilterProp="children"
              disabled={variants.length === 0}
            >
              {variants.map((variant) => (
                <Option key={variant.id} value={variant.id}>
                  {variant.name}{' '}
                  {variant.price && `- ${variant.price.toLocaleString()} VND`}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="location"
            label="Vị trí kho"
            rules={[{ required: true, message: 'Vui lòng nhập vị trí kho' }]}
          >
            <Input placeholder="Ví dụ: Kho A-1, Kệ B-2, ..." />
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="quantity"
                label="Tổng số lượng"
                rules={[
                  { required: true, message: 'Vui lòng nhập số lượng' },
                  {
                    type: 'number',
                    min: 1,
                    message: 'Số lượng phải lớn hơn 0',
                  },
                ]}
              >
                <InputNumber
                  min={1}
                  style={{ width: '100%' }}
                  placeholder="Nhập số lượng"
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                  }
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="used_quantity"
                label="Đã sử dụng"
                rules={[
                  { type: 'number', min: 0, message: 'Số lượng không được âm' },
                ]}
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  placeholder="Nhập số lượng đã dùng"
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                  }
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <style>{`
        .compact-table .ant-table-thead > tr > th {
          padding: 8px 12px !important;
          font-size: 12px;
          font-weight: 600;
        }
        .compact-table .ant-table-tbody > tr > td {
          padding: 6px 12px !important;
          font-size: 12px;
        }
        .compact-table .ant-table-pagination {
          margin: 12px 0 0 0 !important;
        }
      `}</style>
    </div>
  );
};

export default InventoryManager;
